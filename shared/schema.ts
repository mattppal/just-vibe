import { pgTable, text, timestamp, serial, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

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

// Course completion tracking tables
export const courseCompletions = pgTable(
  "course_completions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    lessonSlug: text("lesson_slug").notNull(),
    sectionName: text("section_name"),  // Add section information to organize by topics
    completedAt: timestamp("completed_at").defaultNow().notNull(),
    version: text("version"),  // For tracking content versions (optional)
  },
  (table) => {
    return {
      // Create a unique constraint so users can't complete the same lesson twice
      uniqueUserLesson: uniqueIndex("unique_user_lesson").on(table.userId, table.lessonSlug),
    };
  }
);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  completions: many(courseCompletions),
}));

export const courseCompletionsRelations = relations(courseCompletions, ({ one }) => ({
  user: one(users, { fields: [courseCompletions.userId], references: [users.id] }),
}));

// Types
export type User = typeof users.$inferSelect;

// Course completion types
export const completeLessonSchema = createInsertSchema(courseCompletions, {
  lessonSlug: (schema) => schema.min(1, "Lesson slug is required"),
});
export type CompleteLesson = typeof courseCompletions.$inferInsert;

export const courseCompletionSchema = createSelectSchema(courseCompletions);
export type CourseCompletion = typeof courseCompletions.$inferSelect;
