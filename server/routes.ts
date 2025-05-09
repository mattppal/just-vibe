import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { docs, sections } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for documentation content
  app.get("/api/docs", async (req, res) => {
    try {
      const allDocs = await db.query.docs.findMany({
        where: eq(docs.published, true),
        orderBy: docs.order,
        with: {
          section: true
        }
      });
      
      return res.json(allDocs);
    } catch (error) {
      console.error("Error fetching docs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/docs/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      const doc = await db.query.docs.findFirst({
        where: eq(docs.slug, slug),
        with: {
          section: true
        }
      });
      
      if (!doc) {
        return res.status(404).json({ message: "Documentation not found" });
      }
      
      return res.json(doc);
    } catch (error) {
      console.error("Error fetching doc:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/sections", async (req, res) => {
    try {
      const allSections = await db.query.sections.findMany({
        orderBy: sections.order,
        with: {
          docs: {
            where: eq(docs.published, true),
            orderBy: docs.order
          }
        }
      });
      
      return res.json(allSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
