import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { getAllDocs, getDocBySlug, getDocByPath, getDocsBySection, type Doc } from "./markdown";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.json(null);
      }
      
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.json(null);
      }
      
      const user = await storage.getUser(userId);
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Auth middleware for protected docs
  const protectDocIfNeeded = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = (res.locals.doc as Doc);
      
      // Docs are authenticated by default unless explicitly set to false
      if (doc.authenticated !== false) {
        // Check if user is authenticated
        if (!req.isAuthenticated() || !req.user) {
          // Instead of redirecting, return an error status with a flag for the frontend
          return res.status(401).json({ 
            message: "Authentication required", 
            requiresAuth: true,
            title: doc.title,
            section: doc.section,
            path: doc.path
          });
        }
        
        return next();
      }
      
      // If the doc is public, continue
      return next();
    } catch (error) {
      console.error("Error in auth middleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // API routes for markdown documentation content
  app.get("/api/docs", async (req, res) => {
    try {
      const allDocs = await getAllDocs();
      
      // For unauthenticated users, we'll still include content for search functionality
      // but flag protected docs
      allDocs.forEach(doc => {
        if (doc.authenticated !== false && !req.isAuthenticated()) {
          // Add a flag for frontend to know this requires auth
          (doc as any).requiresAuth = true;
        }
      });
      
      return res.json(allDocs);
    } catch (error) {
      console.error("Error fetching docs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/docs/:slug", async (req, res, next) => {
    try {
      const { slug } = req.params;
      const doc = await getDocBySlug(slug);
      
      if (!doc) {
        return res.status(404).json({ message: "Documentation not found" });
      }
      
      // Attach doc to response locals for middleware
      res.locals.doc = doc;
      next();
    } catch (error) {
      console.error("Error fetching doc:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }, protectDocIfNeeded, (req, res) => {
    return res.json(res.locals.doc);
  });
  
  app.get("/api/docs/path/:path", async (req, res, next) => {
    try {
      let pagePath = req.params.path === "root" ? "/" : `/${req.params.path}`;
      
      // Special handling for root path
      if (pagePath === "/") {
        // First try to find a document specifically for the root path
        const rootDoc = await getDocByPath("/");
        
        // If not found, try to get the introduction document instead
        if (!rootDoc) {
          const introDoc = await getDocByPath("/introduction");
          if (introDoc) {
            console.log("Root document not found, serving introduction as fallback");
            // For API consistency, we'll add a special flag to indicate it's also available at root
            res.locals.doc = { ...introDoc, rootAlias: true, isHomePage: true };
            return next();
          } else {
            // No intro doc found either, try to find any doc to use as fallback
            const allDocs = await getAllDocs();
            if (allDocs && allDocs.length > 0) {
              // Sort by order if available and take the first one
              const sortedDocs = [...allDocs].sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                  return a.order - b.order;
                }
                return 0;
              });
              
              console.log("No home or intro doc found, using first available doc as fallback");
              res.locals.doc = { ...sortedDocs[0], rootAlias: true, isHomePage: true };
              return next();
            }
          }
        } else {
          console.log("Serving root document as home page");
          res.locals.doc = { ...rootDoc, isHomePage: true };
          return next();
        }
      }
      
      // Normal path handling for non-root paths
      const doc = await getDocByPath(pagePath);
      
      if (!doc) {
        console.error(`Document not found for path: ${pagePath}`);
        return res.status(404).json({ message: "Documentation not found" });
      }
      
      // Attach doc to response locals for middleware
      res.locals.doc = doc;
      next();
    } catch (error) {
      console.error("Error fetching doc by path:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }, protectDocIfNeeded, (req, res) => {
    return res.json(res.locals.doc);
  });
  
  app.get("/api/sections", async (req, res) => {
    try {
      const docsBySection = await getDocsBySection();
      
      // Create a lightweight version of the docs with only necessary fields for the sidebar
      const lightweightDocsBySection: Record<string, any[]> = {};
      
      Object.keys(docsBySection).forEach(section => {
        lightweightDocsBySection[section] = docsBySection[section].map(doc => {
          const lightDoc = {
            title: doc.title,
            sidebarTitle: doc.sidebarTitle,
            description: doc.description,
            slug: doc.slug,
            path: doc.path,
            order: doc.order,
          };
          
          // For unauthenticated users, include auth flag
          if (!req.isAuthenticated() && doc.authenticated !== false) {
            (lightDoc as any).requiresAuth = true;
          }
          
          return lightDoc;
        });
      });
      
      return res.json(lightweightDocsBySection);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
