import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// User schema for authentication (matches Replit Auth requirements)
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
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

// Insert schemas
export const upsertUserSchema = createInsertSchema(users);
export type UpsertUser = typeof users.$inferInsert;

// Types
export type User = typeof users.$inferSelect;
