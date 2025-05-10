import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

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

// Rate limiting - protect against brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

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
  
  // Additional security for API endpoints
  // If there's no browser user agent, apply additional checks
  // This helps prevent direct curl/script access
  if (!isBrowserRequest) {
    // If this is not a browser and has no auth header, apply strict API key check
    // Check for session cookies as secondary authentication method
    const hasCookieAuth = req.cookies && Object.keys(req.cookies).some(key => 
      key.toLowerCase().includes('session') || key.toLowerCase().includes('auth')
    );
    
    // Check if request came from the same host (server-to-server communication)
    const isLocalRequest = host && (
      req.ip === '127.0.0.1' || 
      req.ip === '::1' || 
      req.ip === 'localhost'
    );
    
    // If none of the authentication methods are present, block the request
    if (!hasCookieAuth && !isLocalRequest) {
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
