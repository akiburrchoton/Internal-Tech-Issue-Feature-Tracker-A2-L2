//Contains DB Operations 

import { pool } from "../../db";
import bcrypt from 'bcrypt'; 

const createUserIntoDB = async (userData: any)=>{
    const { name, email, password, role } = userData;

    console.log(email)
    // 1. Check if the user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new Error('Email is already registered');
    }

    
    // 2. Hash the password securely (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert the new user into the database
    // Note: We explicitly select fields back to avoid returning the password string
    const queryText = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at
    `;
    const values = [name, email, hashedPassword, role || 'contributor'];
    
    const result = await pool.query(queryText, values);

    console.log(result.rows[0])

    return result.rows[0];
  }

const getUserByEmail = async (email: string) =>{
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}


export const authService = {
    createUserIntoDB,
    getUserByEmail
}