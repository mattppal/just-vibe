import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema for authentication (matches Replit Auth requirements)
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
);

// Documentation content schema
export const docs = pgTable("docs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  section: text("section"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documentation sections for organization
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  order: integer("order").notNull().default(0),
});

// Define relationships
export const docsRelations = relations(docs, ({ one }) => ({
  section: one(sections, {
    fields: [docs.section],
    references: [sections.slug],
  }),
}));

export const sectionsRelations = relations(sections, ({ many }) => ({
  docs: many(docs),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users);
export type UpsertUser = typeof users.$inferInsert;

export const insertDocSchema = createInsertSchema(docs).pick({
  title: true,
  slug: true,
  content: true,
  section: true,
  order: true,
  published: true,
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  name: true,
  slug: true,
  order: true,
});

// Types
export type User = typeof users.$inferSelect;

export type InsertDoc = z.infer<typeof insertDocSchema>;
export type Doc = typeof docs.$inferSelect;

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;
