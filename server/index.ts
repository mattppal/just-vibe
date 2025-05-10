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

// Generate secure tokens for API access
// In a production environment, these should ideally be set through environment variables
// or a secure secrets management solution, not generated on startup

// Get API key from environment or generate a new one
const API_SECRET_KEY = process.env.API_SECRET_KEY || crypto.randomBytes(32).toString('hex');
process.env.API_SECRET_KEY = API_SECRET_KEY;

// Create a permanent token for the application instance
const APP_INSTANCE_TOKEN = process.env.APP_INSTANCE_TOKEN || 
                         `app-${process.env.REPL_ID || crypto.randomBytes(8).toString('hex')}`;
process.env.APP_INSTANCE_TOKEN = APP_INSTANCE_TOKEN;

// In development, only log a masked version of the tokens for security
if (isDevelopment) {
  // Only show the first 8 and last 4 characters of the API key
  const maskedApiKey = API_SECRET_KEY.length > 12 
    ? `${API_SECRET_KEY.substring(0, 8)}...${API_SECRET_KEY.substring(API_SECRET_KEY.length - 4)}` 
    : '********';
    
  // Only show the app- prefix and first few chars of the instance token
  const maskedAppToken = APP_INSTANCE_TOKEN.startsWith('app-') 
    ? `app-${APP_INSTANCE_TOKEN.substring(4, 8)}...` 
    : 'app-********';
    
  console.log(`API_SECRET_KEY=${maskedApiKey} (masked for security)`); 
  console.log(`APP_INSTANCE_TOKEN=${maskedAppToken} (masked for security)`);
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
  
  // Check for API key as an alternative authentication method
  const apiKey = req.get('X-API-Key');
  const hasValidApiKey = apiKey === process.env.API_SECRET_KEY;
  
  // Check if the request is from our own application
  const appInstanceId = process.env.REPL_ID || process.env.APP_INSTANCE_ID || '';
  const secureAppToken = req.get('X-App-Token');
  const hasValidAppToken = secureAppToken === APP_INSTANCE_TOKEN;

  // Build the allowed domains list for referer checking
  const allowedDomains = [
    'localhost:5000',
    req.headers.host || '',
  ];
  
  if (process.env.REPLIT_DOMAINS) {
    // Add all the replit domains
    process.env.REPLIT_DOMAINS.split(',').forEach(domain => {
      domain = domain.trim();
      if (domain) allowedDomains.push(domain);
    });
  }
  
  // Add all potential replit preview domains
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    allowedDomains.push(
      `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
      `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`,
      `${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.repl.co`
    );
  }

  // Extract domain from referer for matching
  let refererDomain = '';
  
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      refererDomain = refererUrl.host;
    } catch (e) {
      // Invalid referer format
      refererDomain = '';
    }
  }
  
  // For direct API calls without a browser user agent (e.g., curl, scripts)
  if (!isBrowserRequest) {
    // For non-browser requests, we require API key or App Token for sensitive endpoints
    // For public endpoints, we'll still allow access for demonstration purposes
    
    // Check if this is a sensitive endpoint (auth, protected docs, etc)
    // Note: We need to check both with and without the /api prefix for proper handling
    const path = req.path.startsWith('/api') ? req.path : `/api${req.path}`;
    const isSensitiveEndpoint = path.includes('/auth/') || 
                              (path.includes('/docs/') && path.includes('protected'));
    
    if (isSensitiveEndpoint && !hasValidApiKey && !hasValidAppToken) {
      // Only restrict access to sensitive endpoints when using non-browser access
      console.warn(`Unauthorized API access attempt to sensitive endpoint: ${req.method} ${req.path} from IP: ${clientIp}`);
      return res.status(403).json({ message: 'Access denied. API key required for this endpoint.' });
    }
    
    // Log attempted access but allow it for demo/learning purposes
    if (!hasValidApiKey && !hasValidAppToken) {
      console.log(`External API access allowed (for demo purposes): ${req.method} ${req.path} from IP: ${clientIp}`);
    }
  } else {
    // For browser requests, we'll check referer for security but won't block requests
    // This allows our application to function while still logging potential security issues
    const isValidReferer = refererDomain && allowedDomains.some(domain => 
      refererDomain === domain || refererDomain.endsWith(`.${domain}`)
    );
    
    if (!isValidReferer && referer && !referer.includes(req.headers.host || '')) {
      // Log the issue but don't block the request to avoid breaking the application
      console.warn(`Suspicious referer: ${refererDomain}, Expected one of: ${allowedDomains.join(', ')}`);
    }
  }
  
  // Apply CSRF protection only to data-modifying requests
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    return csrfProtection(req, res, next);
  }
  
  return next();
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
