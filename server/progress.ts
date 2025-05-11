import { db } from '@db';
import { courseCompletions, completeLessonSchema } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Structure for the progress response
export interface ProgressResponse {
  completedLessons: Record<string, { version: string | null, completedAt: string }>;
  lastActivity: string;
  totalCompletedCount: number;
}

/**
 * Mark a lesson as complete for a user
 * @param userId The ID of the user
 * @param lessonSlug The slug of the lesson to mark as complete
 * @returns The updated lesson completion data
 */
export async function completeLesson(userId: string, lessonSlug: string) {
  try {
    // Validate the data
    const validData = completeLessonSchema.parse({
      userId,
      lessonSlug,
    });

    // Check if the lesson is already completed
    const existingCompletion = await db.query.courseCompletions.findFirst({
      where: and(
        eq(courseCompletions.userId, userId),
        eq(courseCompletions.lessonSlug, lessonSlug)
      )
    });

    // If already completed, just return the existing data
    if (existingCompletion) {
      return existingCompletion;
    }

    // Otherwise, insert a new completion
    const [newCompletion] = await db.insert(courseCompletions)
      .values(validData)
      .returning();

    return newCompletion;
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
}

/**
 * Get all completed lessons for a user
 * @param userId The ID of the user
 * @returns Object with completed lessons and stats
 */
export async function getUserProgress(userId: string): Promise<ProgressResponse> {
  try {
    // Get all completed lessons for the user
    const completions = await db.query.courseCompletions.findMany({
      where: eq(courseCompletions.userId, userId),
      orderBy: (columns) => columns.completedAt,
    });

    // Format the response
    const completedLessons: Record<string, { version: string | null, completedAt: string }> = {};
    let lastActivity = '';

    completions.forEach((completion) => {
      completedLessons[completion.lessonSlug] = {
        version: completion.version,
        completedAt: completion.completedAt.toISOString(),
      };

      // Track the most recent activity
      if (!lastActivity || new Date(completion.completedAt) > new Date(lastActivity)) {
        lastActivity = completion.completedAt.toISOString();
      }
    });

    return {
      completedLessons,
      lastActivity,
      totalCompletedCount: completions.length,
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
}

/**
 * Uncomplete a lesson for a user (mostly for testing/admin purposes)
 * @param userId The ID of the user
 * @param lessonSlug The slug of the lesson to uncomplete
 * @returns Success status
 */
export async function uncompleteLesson(userId: string, lessonSlug: string) {
  try {
    await db.delete(courseCompletions)
      .where(
        and(
          eq(courseCompletions.userId, userId),
          eq(courseCompletions.lessonSlug, lessonSlug)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error uncompleting lesson:', error);
    throw error;
  }
}
