import { Request, Response } from 'express';
import { issueService } from './issues.service';
import { sendError, sendSuccess } from '../../utils/responseHandler';


const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type } = req.body;

    // Basic validation
    if (!title || !description || !type) {
      res.status(400).json({ success: false, message: "Title, description, and type are required" });
      return;
    }

    if (type !== 'bug' && type !== 'feature') {
      res.status(400).json({ success: false, message: "Type must be either 'bug' or 'feature'" });
      return;
    }

    // Extract client identity from middleware state
    const reporter_id = req.user?.id;
    if (!reporter_id) {
       res.status(401).json({ success: false, message: "User identity verification failed" });
       return;
    }

    // Delegate execution to service layer
    const newIssue = await issueService.createNewIssue({
      title,
      description,
      type,
      reporter_id
    });

    // Return success response
    sendSuccess(res, "Issue created successfully", newIssue, 201);
  } catch (error) {
    // Return error
    sendError(res, "Internal server error", 500, error);
  }
};

const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sort, type, status } = req.query;

    // Fetch filtered and sorted issues from service
    const issues = await issueService.getAllIssuesFromDb({
      sort: sort as string,
      type: type as string,
      status: status as string
    });

    // Extract unique reporter IDs to avoid duplicate DB lookups
    const reporterIds = Array.from(new Set(issues.map(issue => issue.reporter_id)));

    // Batch fetch all required reporters in one single query
    const reporters = await issueService.getReportersByIds(reporterIds);

    // Create a quick lookup map of reporter data
    const reporterMap = new Map(reporters.map(user => [user.id, user]));

    // Structure data to match the expected API response schema
    const formattedData = issues.map(issue => {
      const reporterInfo = reporterMap.get(issue.reporter_id) || null;
      
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporterInfo, 
        created_at: issue.created_at,
        updated_at: issue.updated_at
      };
    });

    sendSuccess(res, "Issues retrieved successfully", formattedData);

  } catch (error) {
    sendError(res, "Internal server error", 500, error);
  }
};

const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueId = parseInt(req.params.id as string, 10);

    if (isNaN(issueId)) {
      return sendError(res, "Invalid issue ID format", 400);
    }

    // Fetch the single issue
    const issue = await issueService.getIssueByIdFromDb(issueId);
    if (!issue) {
      return sendError(res, `Issue with ID ${issueId} not found`, 404);
    }

    // Reuse your batch function by passing a single-item array
    const reporters = await issueService.getReportersByIds([issue.reporter_id]);
    const reporterInfo = reporters.length > 0 ? reporters[0] : null;

    // Send final response mapping
    const data = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterInfo,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    }
    sendSuccess(res, "Issue retrieved successfully", data);

  } catch (error) {
    sendError(res, "Internal server error", 500, error);
  }
};

const updateIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueId = parseInt(req.params.id as string, 10);
    const { title, description, type } = req.body;

    // Structural Validations
    if (isNaN(issueId)) {
      return sendError(res, "Invalid issue ID format", 400);
    }

    if (type && type !== 'bug' && type !== 'feature') {
      return sendError(res, "Type must be either 'bug' or 'feature'", 400);
    }

    // Extract identity payload injected by your auth middleware
    const currentUser = req.user;
    if (!currentUser) {
      return sendError(res, "User identity verification failed", 401);
    }

    // Look up target issue first to check state and ownership
    const issue = await issueService.getIssueByIdFromDb(issueId);
    if (!issue) {
      return sendError(res, `Issue with ID ${issueId} not found`, 404);
    }

    // Enforce Authorization Logic Matrix
    if (currentUser.role !== 'maintainer') {
      // Rule A: Contributor must own the record
      if (issue.reporter_id !== currentUser.id) {
        return sendError(res, "Forbidden: You can only update your own issues", 403);
      }
      
      // Rule B: Contributor can only update if current status is "open"
      if (issue.status !== 'open') {
        return sendError(res, "Forbidden: Contributors cannot modify issues that are no longer open", 403);
      }
    }

    // Execute safe update via the service layer
    const updatedIssue = await issueService.updateIssueInDb(issueId, { title, description, type });

    sendSuccess(res, "Issue updated successfully", updatedIssue);

  } catch (error) {
    sendError(res, "Internal server error", 500, error);
  }
};

const deleteIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueId = parseInt(req.params.id as string, 10);

    // Structural Validation
    if (isNaN(issueId)) {
      return sendError(res, "Invalid issue ID format", 400);
    }

    // Extract identity payload injected by auth middleware
    const currentUser = req.user;
    if (!currentUser) {
      return sendError(res, "User identity verification failed", 401);
    }

    // Enforce strict Authorization Logic Matrix (Maintainer only)
    if (currentUser.role !== 'maintainer') {
      return sendError(res, "Forbidden: Only maintainers have permission to delete issues", 403);
    }

    // Delegate deletion to the service layer
    const isDeleted = await issueService.deleteIssueFromDb(issueId);
    
    if (!isDeleted) {
      return sendError(res, `Issue with ID ${issueId} not found`, 404);
    }

    // Send success response
    sendSuccess(res, "Issue deleted successfully");
  } catch (error) {
    sendError(res, "Internal server error", 500, error);
  }
};


export const issuesController = {
    createIssue,
    getIssues,
    getSingleIssue,
    updateIssue,
    deleteIssue
}
