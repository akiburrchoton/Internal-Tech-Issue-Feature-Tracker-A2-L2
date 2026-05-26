import { Router } from 'express';
import { issuesController } from './issues.controller';
import { authenticateJWT } from '../../middleware/authMiddleware';

const router = Router();

// Public route (No middleware protection)
router.get('/', issuesController.getIssues); 
// Fetching Single Issue Details
router.get('/:id', issuesController.getSingleIssue); 

// Protected Routes
// Apply auth protection middleware to the whole subset of routes
router.post('/', authenticateJWT, issuesController.createIssue);
router.patch('/:id', authenticateJWT, issuesController.updateIssue); 
router.delete('/:id', authenticateJWT, issuesController.deleteIssue);

export const issueRouter = router
