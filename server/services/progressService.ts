import { db } from "@db";
import { userProgress, type ProgressData, type UserProgress } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Service to manage user course progress
 */
export class ProgressService {
  /**
   * Get a user's progress data
   * @param userId The user ID
   * @returns The user's progress data or null if not found
   */
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    if (!userId) return undefined;
    
    try {
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
        
      return progress;
    } catch (error) {
      console.error("[PROGRESS SERVICE] Error fetching user progress:", error);
      return undefined;
    }
  }

  /**
   * Get parsed progress data with proper defaults
   * @param userId The user ID
   * @returns Typed progress data object
   */
  async getProgressData(userId: string): Promise<ProgressData> {
    const progress = await this.getUserProgress(userId);
    
    // If no progress exists or data is invalid, return default structure
    if (!progress || !progress.progressData) {
      return {
        completedLessons: {},
        lastActivity: new Date().toISOString(),
        totalCompletedCount: 0
      };
    }
    
    // Parse the JSON data and ensure it has the correct structure
    const data = progress.progressData as unknown as ProgressData;
    
    // Ensure all required fields exist
    return {
      completedLessons: data.completedLessons || {},
      lastActivity: data.lastActivity || new Date().toISOString(),
      totalCompletedCount: data.totalCompletedCount || 0
    };
  }

  /**
   * Mark a lesson as completed
   * @param userId The user ID
   * @param lessonSlug The lesson slug to mark as completed
   * @param version Optional content version for tracking
   * @returns Updated progress data
   */
  async markLessonComplete(userId: string, lessonSlug: string, version?: string): Promise<ProgressData> {
    if (!userId || !lessonSlug) {
      throw new Error("User ID and lesson slug are required");
    }
    
    console.log(`[PROGRESS SERVICE] Marking lesson ${lessonSlug} as complete for user ${userId}`);
    
    try {
      // Get existing progress first
      const progressData = await this.getProgressData(userId);
      
      // Clone the existing data to avoid modifying the original
      const updatedProgressData: ProgressData = {
        completedLessons: { ...progressData.completedLessons },
        lastActivity: new Date().toISOString(),
        totalCompletedCount: progressData.totalCompletedCount
      };
      
      // Check if the lesson was previously completed
      const wasCompleted = !!updatedProgressData.completedLessons[lessonSlug];
      
      // Update the lesson in the completed list
      updatedProgressData.completedLessons[lessonSlug] = {
        completedAt: new Date().toISOString(),
        version: version || null
      };
      
      // Increment the total completed count if not previously completed
      if (!wasCompleted) {
        updatedProgressData.totalCompletedCount++;
      }
      
      // Update the database
      await db
        .update(userProgress)
        .set({
          progressData: updatedProgressData as any,
          lastUpdated: new Date()
        })
        .where(eq(userProgress.userId, userId));
        
      console.log('[PROGRESS SERVICE] Updated progress data:', JSON.stringify(updatedProgressData));
      
      return updatedProgressData;
    } catch (error) {
      console.error('[PROGRESS SERVICE] Error updating progress:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update progress: ${errorMessage}`);
    }
  }

  /**
   * Mark a lesson as not completed (reset progress)
   * @param userId The user ID
   * @param lessonSlug The lesson slug to mark as not completed
   * @returns Updated progress data
   */
  async markLessonIncomplete(userId: string, lessonSlug: string): Promise<ProgressData> {
    if (!userId || !lessonSlug) {
      throw new Error("User ID and lesson slug are required");
    }
    
    console.log(`[PROGRESS SERVICE] Marking lesson ${lessonSlug} as incomplete for user ${userId}`);
    
    try {
      // Get existing progress first
      const progressData = await this.getProgressData(userId);
      
      // Clone the existing data to avoid modifying the original
      const updatedProgressData: ProgressData = {
        completedLessons: { ...progressData.completedLessons },
        lastActivity: new Date().toISOString(),
        totalCompletedCount: progressData.totalCompletedCount
      };
      
      // Check if the lesson was previously completed
      if (updatedProgressData.completedLessons[lessonSlug]) {
        // Delete the lesson from the completed list
        delete updatedProgressData.completedLessons[lessonSlug];
        
        // Decrement the total completed count
        updatedProgressData.totalCompletedCount = Math.max(0, updatedProgressData.totalCompletedCount - 1);
        
        // Update the database
        await db
          .update(userProgress)
          .set({
            progressData: updatedProgressData as any,
            lastUpdated: new Date()
          })
          .where(eq(userProgress.userId, userId));
          
        console.log('[PROGRESS SERVICE] Updated progress data:', JSON.stringify(updatedProgressData));
      } else {
        console.log('[PROGRESS SERVICE] Lesson was not previously completed, no change needed');
      }
      
      return updatedProgressData;
    } catch (error) {
      console.error('[PROGRESS SERVICE] Error updating progress:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update progress: ${errorMessage}`);
    }
  }

  /**
   * Calculate completion percentage for a user
   * @param userId The user ID
   * @param totalLessons Total number of lessons in the course
   * @returns Completion percentage (0-100)
   */
  async getCompletionPercentage(userId: string, totalLessons: number): Promise<number> {
    if (!userId || totalLessons <= 0) return 0;
    
    const progressData = await this.getProgressData(userId);
    
    if (progressData.totalCompletedCount <= 0) return 0;
    
    return Math.min(100, Math.round((progressData.totalCompletedCount / totalLessons) * 100));
  }

  /**
   * Check if a specific lesson is completed
   * @param userId The user ID
   * @param lessonSlug The lesson slug to check
   * @returns True if completed, false otherwise
   */
  async isLessonCompleted(userId: string, lessonSlug: string): Promise<boolean> {
    if (!userId || !lessonSlug) return false;
    
    const progressData = await this.getProgressData(userId);
    return !!progressData.completedLessons[lessonSlug];
  }

  /**
   * Get a map of lesson slugs to completion status
   * @param userId The user ID
   * @param lessonSlugs Array of lesson slugs to check
   * @returns Map of lesson slugs to completion status
   */
  async getLessonsCompletionStatus(userId: string, lessonSlugs: string[]): Promise<Record<string, boolean>> {
    if (!userId || !lessonSlugs.length) return {};
    
    const progressData = await this.getProgressData(userId);
    
    // Create a map of lesson slugs to completion status
    const completionMap: Record<string, boolean> = {};
    
    for (const slug of lessonSlugs) {
      completionMap[slug] = !!progressData.completedLessons[slug];
    }
    
    return completionMap;
  }
}

export const progressService = new ProgressService();
