import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
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

// Course progress tracking table
export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey().notNull().references(() => users.id),
  progressData: jsonb("progress_data").notNull().default('{}'),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert/update schemas
export const upsertProgressSchema = createInsertSchema(userProgress);
export type UpsertProgress = typeof userProgress.$inferInsert;

// Types
export type User = typeof users.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;

// Progress data structure type (for TypeScript)
export interface ProgressData {
  completedLessons: {
    [lessonSlug: string]: {
      completedAt: string; // ISO timestamp
      version?: string;    // Optional version tracking for content updates
    }
  };
  lastActivity: string;    // ISO timestamp
  totalCompletedCount: number; // For quick progress calculation
}
