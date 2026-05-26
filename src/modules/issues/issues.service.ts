import { pool } from "../../db";
import { CreateIssueInput, GetIssuesFilter } from "./issues.interfaces";


const createNewIssue = async (data: CreateIssueInput) => {
  const queryText = `
    INSERT INTO issues (title, description, type, status, reporter_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
  `;
  
  const values = [data.title, data.description, data.type, 'open', data.reporter_id];
  const result = await pool.query(queryText, values);
  
  return result.rows[0];
};


const getAllIssuesFromDb = async (filters: GetIssuesFilter) => {
  let queryText = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues`;
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  // Dynamic Filtering
  if (filters.type) {
    queryParams.push(filters.type);
    whereClauses.push(`type = $${queryParams.length}`);
  }
  
  if (filters.status) {
    queryParams.push(filters.status);
    whereClauses.push(`status = $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryText += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Dynamic Sorting
  const sortOrder = filters.sort === 'oldest' ? 'ASC' : 'DESC';
  queryText += ` ORDER BY created_at ${sortOrder}`;

  const result = await pool.query(queryText, queryParams);
  return result.rows;
};

const getReportersByIds = async (ids: number[]) => {
  if (ids.length === 0) return [];
  
  // Generates placeholders like $1, $2, $3 dynamically
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
  const queryText = `SELECT id, name, role FROM users WHERE id IN (${placeholders})`;
  
  const result = await pool.query(queryText, ids);
  return result.rows;
};

export const issueService = {
    createNewIssue, 
    getAllIssuesFromDb,
    getReportersByIds
}