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
  
  app.get("/api/docs/path/:path(*)", async (req, res, next) => {
    try {
      // Handle root path (this is for backwards compatibility)
      if (req.params.path === "root") {
        // First try to find a document specifically for the root path
        const rootDoc = await getDocByPath("/");
        
        // If not found, try to get the introduction document instead
        if (!rootDoc) {
          const introDoc = await getDocByPath("/welcome/introduction");
          if (introDoc) {
            // For API consistency, we'll add a special flag to indicate it's also available at root
            res.locals.doc = { ...introDoc, rootAlias: true };
            return next();
          }
        } else {
          res.locals.doc = rootDoc;
          return next();
        }
      }
      
      // Format the path parameter to handle both the old format (/introduction) 
      // and the new format (/welcome/introduction)
      let pagePath = `/${req.params.path}`;
      
      // Backward compatibility for old-style paths without section
      if (!pagePath.includes('/') || pagePath.split('/').length === 2) {
        // Try the sections for common pages
        const sections = ["welcome", "getting-started", "core-concepts"];
        for (const section of sections) {
          const potentialPath = `/${section}${pagePath}`;
          const doc = await getDocByPath(potentialPath);
          if (doc) {
            res.locals.doc = doc;
            return next();
          }
        }
      }
      
      // Normal path handling for non-root paths
      const doc = await getDocByPath(pagePath);
      
      if (!doc) {
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
