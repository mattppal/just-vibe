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
    // First try to find the exact lesson slug as provided
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

    // Parse the section name and ensure we save the full path
    // For format like "getting-started/installation", extract "getting-started" as section
    // and save the full normalized path as the lessonSlug
    let sectionName = null;
    
    // Normalize the lesson slug to ensure consistent format
    // Remove any numeric prefixes from all path segments
    const normalizedSlug = lessonSlug.split('/').map(segment => {
      return segment.replace(/^\d+-/, '');
    }).join('/');
    
    // Extract section name if available
    if (normalizedSlug.includes('/')) {
      const parts = normalizedSlug.split('/');
      if (parts.length > 1 && parts[0]) {
        sectionName = parts[0]; // Already normalized above
      }
    }
    
    // Otherwise, insert a new completion with the full normalized path
    const [newCompletion] = await db.insert(courseCompletions)
      .values({
        userId,
        lessonSlug: normalizedSlug, // Save the full normalized path
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
    // Normalize the lesson slug to ensure consistent format
    // Remove any numeric prefixes from all path segments
    const normalizedSlug = lessonSlug.split('/').map(segment => {
      return segment.replace(/^\d+-/, '');
    }).join('/');
    
    await db.delete(courseCompletions)
      .where(
        and(
          eq(courseCompletions.userId, userId),
          eq(courseCompletions.lessonSlug, normalizedSlug)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error uncompleting lesson:', error);
    throw error;
  }
}
