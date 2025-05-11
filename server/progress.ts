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
    const existingCompletion = await db.select({
      id: courseCompletions.id,
      userId: courseCompletions.userId,
      lessonSlug: courseCompletions.lessonSlug,
      completedAt: courseCompletions.completedAt,
      version: courseCompletions.version
    })
    .from(courseCompletions)
    .where(and(
      eq(courseCompletions.userId, userId),
      eq(courseCompletions.lessonSlug, lessonSlug)
    ))
    .limit(1);

    // If already completed, just return the existing data
    if (existingCompletion && existingCompletion.length > 0) {
      return existingCompletion[0];
    }

    // Parse the section name from the lessonSlug if available
    // For format like "1-getting-started/installation", extract "getting-started"
    let sectionName = null;
    if (lessonSlug.includes('/')) {
      const parts = lessonSlug.split('/');
      if (parts.length > 1 && parts[0]) {
        // Remove numeric prefix if present (e.g., "1-getting-started" -> "getting-started")
        sectionName = parts[0].replace(/^\d+-/, '');
      }
    }

    // Otherwise, insert a new completion
    const [newCompletion] = await db.insert(courseCompletions)
      .values({
        ...validData,
        sectionName
      })
      .returning({ 
        id: courseCompletions.id,
        userId: courseCompletions.userId,
        lessonSlug: courseCompletions.lessonSlug,
        completedAt: courseCompletions.completedAt,
        version: courseCompletions.version
      });

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
    const completions = await db.select({
      id: courseCompletions.id,
      userId: courseCompletions.userId,
      lessonSlug: courseCompletions.lessonSlug,
      completedAt: courseCompletions.completedAt,
      version: courseCompletions.version
    })
    .from(courseCompletions)
    .where(eq(courseCompletions.userId, userId))
    .orderBy(courseCompletions.completedAt);

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
