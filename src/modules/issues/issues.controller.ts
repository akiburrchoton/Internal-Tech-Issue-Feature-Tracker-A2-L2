import { Request, Response } from 'express';
import { issueService } from './issues.service';


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
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: newIssue
    });

  } catch (error) {
    console.error("Create Issue Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: formattedData
    });

  } catch (error) {
    console.error("Get Issues Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueId = parseInt(req.params.id as string, 10);

    if (isNaN(issueId)) {
      res.status(400).json({ success: false, message: "Invalid issue ID format" });
      return;
    }

    // Fetch the single issue
    const issue = await issueService.getIssueByIdFromDb(issueId);
    if (!issue) {
      res.status(404).json({ success: false, message: `Issue with ID ${issueId} not found` });
      return;
    }

    // Reuse your batch function by passing a single-item array
    const reporters = await issueService.getReportersByIds([issue.reporter_id]);
    const reporterInfo = reporters.length > 0 ? reporters[0] : null;

    // Send final response mapping
    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporterInfo,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }
    });

  } catch (error) {
    console.error("Get Single Issue Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const issueId = parseInt(req.params.id as string, 10);
    const { title, description, type } = req.body;

    // Structural Validations
    if (isNaN(issueId)) {
      res.status(400).json({ success: false, message: "Invalid issue ID format" });
      return;
    }

    if (type && type !== 'bug' && type !== 'feature') {
      res.status(400).json({ success: false, message: "Type must be either 'bug' or 'feature'" });
      return;
    }

    // Extract identity payload injected by your auth middleware
    const currentUser = req.user;
    if (!currentUser) {
      res.status(401).json({ success: false, message: "User identity verification failed" });
      return;
    }

    // Look up target issue first to check state and ownership
    const issue = await issueService.getIssueByIdFromDb(issueId);
    if (!issue) {
      res.status(404).json({ success: false, message: `Issue with ID ${issueId} not found` });
      return;
    }

    // Enforce Authorization Logic Matrix
    if (currentUser.role !== 'maintainer') {
      // Rule A: Contributor must own the record
      if (issue.reporter_id !== currentUser.id) {
        res.status(403).json({ success: false, message: "Forbidden: You can only update your own issues" });
        return;
      }
      
      // Rule B: Contributor can only update if current status is "open"
      if (issue.status !== 'open') {
        res.status(403).json({ success: false, message: "Forbidden: Contributors cannot modify issues that are no longer open" });
        return;
      }
    }

    // Execute safe update via the service layer
    const updatedIssue = await issueService.updateIssueInDb(issueId, { title, description, type });

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue
    });

  } catch (error) {
    console.error("Update Issue Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




export const issuesController = {
    createIssue,
    getIssues,
    getSingleIssue,
    updateIssue
}
