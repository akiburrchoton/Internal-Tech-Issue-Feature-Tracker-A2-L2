export interface CreateIssueInput {
  title: string;
  description: string;
  type: 'bug' | 'feature';
  reporter_id: number;
}

export interface GetIssuesFilter {
  type?: string;
  status?: string;
  sort?: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  type?: 'bug' | 'feature';
}