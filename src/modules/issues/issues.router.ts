import { Router } from 'express';
import { issuesController } from './issues.controller';
import { authenticateJWT } from '../../middleware/authMiddleware';

const router = Router();

// Public route (No middleware protection)
router.get('/', issuesController.getIssues); 

// Apply auth protection middleware to the whole subset of routes
router.post('/', authenticateJWT, issuesController.createIssue);

export const issueRouter = router
