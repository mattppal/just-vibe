import { Router } from 'express';
import { progressService } from '../services/progressService';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Get current user's progress
 */
router.get('/', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    console.log(`[PROGRESS API] Fetching progress data for user ${userId}`);
    const progressData = await progressService.getProgressData(userId);
    
    console.log(`[PROGRESS API] Returning progress data:`, {
      userId,
      totalComplete: progressData.totalCompletedCount,
      completedLessons: Object.keys(progressData.completedLessons)
    });
    
    // Set cache control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    res.json(progressData);
  } catch (error) {
    console.error('[PROGRESS API] Error fetching progress:', error);
    res.status(500).json({ message: 'Error fetching progress' });
  }
});

/**
 * Get completion status for all lessons
 */
router.get('/status', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const lessonSlugs = req.query.slugs?.split(',') || [];
    
    if (!lessonSlugs.length) {
      return res.status(400).json({ message: 'No lesson slugs provided' });
    }
    
    const completionStatus = await progressService.getLessonsCompletionStatus(userId, lessonSlugs);
    res.json(completionStatus);
  } catch (error) {
    console.error('Error fetching lesson status:', error);
    res.status(500).json({ message: 'Error fetching lesson status' });
  }
});

/**
 * Mark a lesson as complete
 */
router.post('/lesson/:slug/complete', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const lessonSlug = req.params.slug;
    const { version } = req.body;
    
    console.log(`[PROGRESS API] User ${userId} attempting to mark lesson ${lessonSlug} as complete`);
    
    if (!lessonSlug) {
      return res.status(400).json({ message: 'Lesson slug is required' });
    }
    
    const updatedProgress = await progressService.markLessonComplete(userId, lessonSlug, version);
    console.log('[PROGRESS API] Updated database with progress:', { userId, lessonSlug, totalComplete: updatedProgress.totalCompletedCount, data: JSON.stringify(updatedProgress.completedLessons) });
    
    // Set cache control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    res.json(updatedProgress);
  } catch (error) {
    console.error('[PROGRESS API] Error marking lesson as complete:', error);
    res.status(500).json({ message: 'Error marking lesson as complete' });
  }
});

/**
 * Mark a lesson as incomplete
 */
router.post('/lesson/:slug/incomplete', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const lessonSlug = req.params.slug;
    
    console.log(`[PROGRESS API] User ${userId} attempting to mark lesson ${lessonSlug} as incomplete`);
    
    if (!lessonSlug) {
      return res.status(400).json({ message: 'Lesson slug is required' });
    }
    
    const updatedProgress = await progressService.markLessonIncomplete(userId, lessonSlug);
    console.log('[PROGRESS API] Unmarked lesson in database:', { userId, lessonSlug, totalComplete: updatedProgress.totalCompletedCount, data: JSON.stringify(updatedProgress.completedLessons) });
    
    // Set cache control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    res.json(updatedProgress);
  } catch (error) {
    console.error('[PROGRESS API] Error marking lesson as incomplete:', error);
    res.status(500).json({ message: 'Error marking lesson as incomplete' });
  }
});

/**
 * Get completion percentage
 */
router.get('/percentage', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const totalLessons = parseInt(req.query.total || '0', 10);
    
    if (isNaN(totalLessons) || totalLessons <= 0) {
      return res.status(400).json({ message: 'Valid total lessons count is required' });
    }
    
    const percentage = await progressService.getCompletionPercentage(userId, totalLessons);
    res.json({ percentage });
  } catch (error) {
    console.error('Error calculating completion percentage:', error);
    res.status(500).json({ message: 'Error calculating completion percentage' });
  }
});

export default router;
