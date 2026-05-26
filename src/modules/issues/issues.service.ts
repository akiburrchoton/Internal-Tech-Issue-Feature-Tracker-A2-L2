import { pool } from "../../db";
import { CreateIssueInput, GetIssuesFilter, UpdateIssueInput } from "./issues.interfaces";


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


const getIssueByIdFromDb = async (id: number) => {
  const queryText = `
    SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
    FROM issues 
    WHERE id = $1
  `;
  const result = await pool.query(queryText, [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0]; // Returns the single issue object directly
};


const updateIssueInDb = async (id: number, data: UpdateIssueInput) => {
  const fields: string[] = [];
  const values: any[] = [];

  // Dynamically build the SET clauses for fields that are provided
  if (data.title !== undefined) {
    values.push(data.title);
    fields.push(`title = $${values.length}`);
  }
  if (data.description !== undefined) {
    values.push(data.description);
    fields.push(`description = $${values.length}`);
  }
  if (data.type !== undefined) {
    values.push(data.type);
    fields.push(`type = $${values.length}`);
  }

  // If no fields are provided to update, simply fetch and return the fresh record
  if (fields.length === 0) {
    return getIssueByIdFromDb(id);
  }

  // Append the ID parameter to the end of the query array
  values.push(id);
  const queryText = `
    UPDATE issues 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
  `;

  const result = await pool.query(queryText, values);
  return result.rows[0];
};


const deleteIssueFromDb = async (id: number): Promise<boolean> => {
  const queryText = `DELETE FROM issues WHERE id = $1 RETURNING id`;
  const result = await pool.query(queryText, [id]);
  
  // Returns true if a row was actually deleted, false if the ID didn't exist
  return result.rows.length > 0;
};


export const issueService = {
    createNewIssue, 
    getAllIssuesFromDb,
    getReportersByIds,
    getIssueByIdFromDb,
    updateIssueInDb,
    deleteIssueFromDb
}