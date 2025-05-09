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
        return isAuthenticated(req, res, next);
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
      
      // For unauthenticated users, only include basic info for authenticated docs
      if (!req.isAuthenticated()) {
        allDocs.forEach(doc => {
          if (doc.authenticated !== false) {
            doc.content = "";
            doc.html = "";
            (doc as any).requiresAuth = true; // Flag for frontend
          }
        });
      }
      
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
      const pagePath = req.params.path === "root" ? "/" : `/${req.params.path}`;
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
      
      // For unauthenticated users, only include basic info for authenticated docs
      if (!req.isAuthenticated()) {
        Object.keys(docsBySection).forEach(section => {
          docsBySection[section].forEach((doc: any) => {
            if (doc.authenticated !== false) {
              doc.requiresAuth = true; // Flag for frontend
            }
          });
        });
      }
      
      return res.json(docsBySection);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
