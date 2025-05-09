import type { Express } from "express";
import { createServer, type Server } from "http";
import { getAllDocs, getDocBySlug, getDocByPath, getDocsBySection } from "./markdown";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for markdown documentation content
  app.get("/api/docs", async (req, res) => {
    try {
      const allDocs = await getAllDocs();
      return res.json(allDocs);
    } catch (error) {
      console.error("Error fetching docs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/docs/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const doc = await getDocBySlug(slug);
      
      if (!doc) {
        return res.status(404).json({ message: "Documentation not found" });
      }
      
      return res.json(doc);
    } catch (error) {
      console.error("Error fetching doc:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/docs/path/:path", async (req, res) => {
    try {
      const pagePath = req.params.path === "root" ? "/" : `/${req.params.path}`;
      const doc = await getDocByPath(pagePath);
      
      if (!doc) {
        return res.status(404).json({ message: "Documentation not found" });
      }
      
      return res.json(doc);
    } catch (error) {
      console.error("Error fetching doc by path:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/sections", async (req, res) => {
    try {
      const sections = await getDocsBySection();
      return res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
