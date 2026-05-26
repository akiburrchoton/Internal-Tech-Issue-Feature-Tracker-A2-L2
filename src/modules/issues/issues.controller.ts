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


export const issuesController = {
    createIssue,
    getIssues
}
