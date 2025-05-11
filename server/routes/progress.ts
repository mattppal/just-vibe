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
    const progressData = await progressService.getProgressData(userId);
    
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching progress:', error);
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
    
    console.log(`User ${userId} attempting to mark lesson ${lessonSlug} as complete`);
    
    if (!lessonSlug) {
      return res.status(400).json({ message: 'Lesson slug is required' });
    }
    
    const updatedProgress = await progressService.markLessonComplete(userId, lessonSlug, version);
    console.log('Updated progress for user:', { userId, lessonSlug, totalComplete: updatedProgress.totalCompletedCount });
    res.json(updatedProgress);
  } catch (error) {
    console.error('Error marking lesson as complete:', error);
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
    
    if (!lessonSlug) {
      return res.status(400).json({ message: 'Lesson slug is required' });
    }
    
    const updatedProgress = await progressService.markLessonIncomplete(userId, lessonSlug);
    res.json(updatedProgress);
  } catch (error) {
    console.error('Error marking lesson as incomplete:', error);
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
