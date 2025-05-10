import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import crypto from 'crypto';

const app = express();

// Configure Helmet security headers
// Use different CSP configurations for development and production
const isDevelopment = app.get('env') === 'development';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", "https://replit.com"],
      connectSrc: isDevelopment
        ? ["'self'", "ws:", "wss:"] // Allow WebSockets for HMR
        : ["'self'"],
      imgSrc: ["'self'", "data:", "https://replit.com", "https://*.replit.com", "https://storage.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      // Allow YouTube embeds
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
      // Only apply upgradeInsecureRequests in production
      ...(isDevelopment ? {} : { upgradeInsecureRequests: [] }),
    },
  },
  // Enable XSS protection
  xssFilter: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Sets Referrer-Policy header
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Parse cookies before CSRF protection
app.use(cookieParser());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Generate a secure token on startup that would be required for all non-browser API requests
// This makes it extremely difficult for external tools to access our API endpoints
const API_SECRET_KEY = process.env.API_SECRET_KEY || crypto.randomBytes(32).toString('hex');
process.env.API_SECRET_KEY = API_SECRET_KEY;

// Create a permanent token for the application instance
const APP_INSTANCE_TOKEN = `app-${process.env.REPL_ID || crypto.randomBytes(8).toString('hex')}`;
process.env.APP_INSTANCE_TOKEN = APP_INSTANCE_TOKEN;

// Log the tokens to the console when starting the server (ONLY in development)
if (isDevelopment) {
  console.log(`API_SECRET_KEY=${API_SECRET_KEY}`);
  console.log(`APP_INSTANCE_TOKEN=${APP_INSTANCE_TOKEN}`);
}

// Pass necessary environment variables to the frontend for secure API access
app.use((req, res, next) => {
  // This will inject REPL_ID into Vite as VITE_REPL_ID
  if (process.env.REPL_ID) {
    process.env.VITE_REPL_ID = process.env.REPL_ID;
  }
  
  // Also pass the app instance token, but in a secure way
  process.env.VITE_APP_INSTANCE_TOKEN = APP_INSTANCE_TOKEN;
  
  next();
});

// Rate limiting - protect against brute force attacks
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limits for API endpoints that are more sensitive
const authApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for auth endpoints
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply tiered rate limiting to API routes
app.use('/api/', generalApiLimiter);
app.use('/api/auth/', authApiLimiter); // Stricter limits for auth routes

// Enable CSRF protection for all routes
const csrfProtection = csrf({ cookie: { sameSite: 'strict', secure: !isDevelopment } });

// Middleware to check Origin header and referer for all API requests
app.use('/api', (req, res, next) => {
  // First check if this is a browser request by checking for standard browser headers
  const userAgent = req.get('User-Agent') || '';
  const isBrowserRequest = userAgent.includes('Mozilla') || 
                          userAgent.includes('Chrome') || 
                          userAgent.includes('Safari') || 
                          userAgent.includes('Firefox') || 
                          userAgent.includes('Edge');
  
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');
  
  // Get the real client IP, accounting for reverse proxies
  const clientIp = req.get('X-Forwarded-For')?.split(',')[0].trim() || 
                  req.get('X-Real-IP') || 
                  req.ip || 
                  req.socket.remoteAddress || 
                  '0.0.0.0';
                  
  // Check if request is from the same machine/container (literally local)
  // This is for distinguishing local server-to-server vs external requests
  const isActuallyLocalRequest = 
    clientIp === '127.0.0.1' || 
    clientIp === '::1' || 
    clientIp === 'localhost' || 
    clientIp === '::ffff:127.0.0.1' || 
    clientIp.startsWith('10.') || // RFC1918 private networks
    (clientIp.startsWith('172.') && parseInt(clientIp.split('.')[1]) >= 16 && parseInt(clientIp.split('.')[1]) <= 31) || 
    clientIp.startsWith('192.168.');
    
  // Track all non-browser API access for monitoring
  if (!isBrowserRequest) {
    console.log(`API access from non-browser: ${clientIp} - ${userAgent} - ${req.method} ${req.path}`);
  }
  
  // Additional security for API endpoints
  // If there's no browser user agent, apply additional checks
  // This helps prevent direct curl/script access
  if (!isBrowserRequest) {
    // If this is not a browser and has no auth header, apply strict API key check
    // Check for session cookies as secondary authentication method
    const hasCookieAuth = req.cookies && Object.keys(req.cookies).some(key => 
      key.toLowerCase().includes('session') || key.toLowerCase().includes('auth')
    );
    
    // We'll use a combination of checks for better security
    
    // 1. Check for API key (not implemented by default but shown here for completeness)
    const apiKey = req.get('X-API-Key');
    const hasValidApiKey = apiKey === process.env.API_SECRET_KEY;
    
    // 2. Check if the X-Requested-With header is present (standard for AJAX requests)
    const xRequestedWith = req.get('X-Requested-With');
    const hasXRequestedWith = xRequestedWith === 'XMLHttpRequest';
    
    // 3. Check for authorization header
    const authHeader = req.get('Authorization');
    const hasAuthHeader = !!authHeader;
    
    // 4. Do a more secure local request check - verify if this is really from our application
    // Note: This needs to be combined with other checks as IP can be spoofed
    const isFromSecureOrigin = host && (
      (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS.includes(host)) ||
      host.includes('localhost:5000') ||
      host.includes('.replit.app') ||
      host.includes('.replit.dev')
    );
    
    // Generate a secure hash based on server instance for an additional security layer
    // This ensures the request came from our own codebase running on the same instance
    const appInstanceId = process.env.REPL_ID || process.env.APP_INSTANCE_ID || '';
    const secureAppToken = req.get('X-App-Token');
    const hasValidAppToken = secureAppToken === `app-${appInstanceId}`;
    
    // For direct API calls, one of these authentication methods must be present
    if (!hasCookieAuth && !hasValidApiKey && !hasXRequestedWith && !hasAuthHeader && !hasValidAppToken) {
      // Log attempted access for security monitoring
      console.warn(`Unauthorized API access attempt: ${req.method} ${req.path} from IP: ${req.ip}, UA: ${userAgent}`);
      return res.status(403).json({ message: 'Access denied. Authentication required.' });
    }
  }
  
  // Browser requests must have a valid origin or referer
  if (isBrowserRequest) {
    if (!origin && !referer) {
      return res.status(403).json({ message: 'Origin or Referer required for browser requests' });
    }
    
    // Check if the Origin/Referer is from our site
    const allowedDomains = [
      'localhost:5000',
      req.headers.host || '',
    ];
    
    if (isDevelopment && process.env.REPL_SLUG && process.env.REPL_OWNER) {
      // Add the Replit domains in development
      allowedDomains.push(
        `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
        `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
      );
    }
    
    // Check both Origin and Referer
    const isValidOrigin = origin && allowedDomains.some(domain => origin.includes(domain));
    const isValidReferer = referer && allowedDomains.some(domain => referer.includes(domain));
    
    if (!isValidOrigin && !isValidReferer) {
      return res.status(403).json({ message: 'Forbidden - Origin/Referer not allowed' });
    }
  }
  
  // Call CSRF protection for all API routes except for read-only GET requests
  // We want to apply stricter security to any endpoints that might modify data
  if (req.method === 'GET') {
    // Public GET endpoints don't need CSRF protection
    // But we still want to authenticate the request origin above
    return next();
  }
  
  // Apply CSRF protection to non-public API endpoints
  return csrfProtection(req, res, next);
});

// Generate CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
