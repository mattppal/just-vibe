import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

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
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

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
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDoc = z.infer<typeof insertDocSchema>;
export type Doc = typeof docs.$inferSelect;

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;
