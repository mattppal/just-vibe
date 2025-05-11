import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import {
  getAllDocs,
  getDocBySlug,
  getDocByPath,
  getDocsBySection,
  type Doc,
} from "./markdown";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { completeLesson, getUserProgress, uncompleteLesson } from "./progress";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", async (req: Request, res: Response) => {
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
  const protectDocIfNeeded = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const doc = res.locals.doc as Doc;

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
            path: doc.path,
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
      allDocs.forEach((doc) => {
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

  app.get(
    "/api/docs/:slug",
    async (req, res, next) => {
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
    },
    protectDocIfNeeded,
    (req, res) => {
      return res.json(res.locals.doc);
    },
  );

  app.get(
    "/api/docs/path/:path(*)",
    async (req, res, next) => {
      try {
        // Special case for root path - req.params.path will be empty string for '/'
        if (req.params.path === "" || req.params.path === "root") {
          console.log("Handling root path request, params:", req.params);

          // Get all docs to see if our root doc is there
          const allDocs = await getAllDocs();
          console.log(
            "Available docs (full details):",
            JSON.stringify(
              allDocs.map((d) => {
                return {
                  title: d.title,
                  path: d.path,
                  slug: d.slug,
                  section: d.section,
                  sourceDir: (d as any).sourceDir,
                };
              }),
              null,
              2,
            ),
          );

          // Find our root doc manually from allDocs
          const rootDoc = allDocs.find((doc) => doc.path === "/");
          console.log(
            "Manual root doc search result:",
            rootDoc ? `Found: ${rootDoc.title}` : "Not found",
          );

          // Use the manually found doc instead of calling getDocByPath
          if (rootDoc) {
            console.log("Using manually found root document");
            res.locals.doc = rootDoc;
            return next();
          }

          // If root doc not found, fall back to introduction
          const introDoc = await getDocByPath("/welcome/introduction");
          if (introDoc) {
            // For API consistency, add a special flag to indicate it's also available at root
            res.locals.doc = { ...introDoc, rootAlias: true };
            return next();
          }
        }

        // Format the path parameter to handle both the old format (/introduction)
        // and the new format (/welcome/introduction)
        let pagePath = `/${req.params.path}`;

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
    },
    protectDocIfNeeded,
    (req, res) => {
      return res.json(res.locals.doc);
    },
  );

  app.get("/api/sections", async (req, res) => {
    try {
      const docsBySection = await getDocsBySection();

      // Create a lightweight version of the docs with only necessary fields for the sidebar
      const lightweightDocsBySection: Record<string, any[]> = {};

      Object.keys(docsBySection).forEach((section) => {
        lightweightDocsBySection[section] = docsBySection[section].map(
          (doc) => {
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
          },
        );
      });

      return res.json(lightweightDocsBySection);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Course progress tracking API endpoints
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user ID" });
      }

      const progress = await getUserProgress(userId);
      return res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      return res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress/complete", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user ID" });
      }

      // Debug the raw request
      console.log('Raw request body:', req.body);
      console.log('Request headers:', req.headers);
      
      // Check for different potential structures
      let lessonSlug: string | undefined;
      
      if (typeof req.body === 'string') {
        // If the body is a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(req.body);
          lessonSlug = parsed.lessonSlug;
        } catch (e) {
          console.error('Failed to parse request body as JSON:', e);
        }
      } else if (req.body && typeof req.body === 'object') {
        // If the body is already an object, extract lessonSlug
        if ('lessonSlug' in req.body) {
          lessonSlug = req.body.lessonSlug;
        } else if (req.body.body && typeof req.body.body === 'string') {
          // Sometimes the body might be nested
          try {
            const parsed = JSON.parse(req.body.body);
            lessonSlug = parsed.lessonSlug;
          } catch (e) {
            console.error('Failed to parse nested body as JSON:', e);
          }
        }
      }
      
      console.log('Extracted lessonSlug:', lessonSlug, 'type:', typeof lessonSlug);
      
      if (!lessonSlug) {
        return res.status(400).json({ message: "Lesson slug is required" });
      }
      
      // Validate the slug format (basic check)
      if (typeof lessonSlug !== 'string' || lessonSlug.trim() === '') {
        return res.status(400).json({ message: "Invalid lesson slug format" });
      }

      await completeLesson(userId, lessonSlug);
      
      // Return the updated progress
      const progress = await getUserProgress(userId);
      return res.json(progress);
    } catch (error) {
      console.error("Error completing lesson:", error);
      return res.status(500).json({ message: "Failed to complete lesson" });
    }
  });

  // Admin endpoint to uncomplete a lesson (for testing)
  app.post("/api/progress/uncomplete", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user ID" });
      }

      const { lessonSlug } = req.body;
      if (!lessonSlug) {
        return res.status(400).json({ message: "Lesson slug is required" });
      }

      await uncompleteLesson(userId, lessonSlug);
      
      // Return the updated progress
      const progress = await getUserProgress(userId);
      return res.json(progress);
    } catch (error) {
      console.error("Error uncompleting lesson:", error);
      return res.status(500).json({ message: "Failed to uncomplete lesson" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
