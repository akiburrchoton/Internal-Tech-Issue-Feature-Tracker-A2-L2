import{  type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authService } from './auth.service';
import config from '../../config';
import { pool } from '../../db';

const signupUser = async (req: Request, res: Response) => {
  
  try {
      const { name, email, password, role } = req.body;

      // Simple input validation
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Name, email, and password are required fields',
        });
        return;
      }

      // Execute registration via service layer
      const newUser = await authService.createUserIntoDB({ name, email, password, role });

      // Return identical structure matching your successful response design
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: newUser,
      });
    } catch (error) {
      const err = error as Error;
      
      // Handle known duplicate issues or generic server errors gracefully
      const statusCode = err.message === 'Email is already registered' ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error occurred during registration',
      });
    }
}

const loginUser = async (req: Request, res: Response) => {
  const JWT_SECRET = config.jwt_secret
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

     // Fetch user using the service layer
    const user = await authService.getUserByEmail(email);
    
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Compare password hash
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Generate JWT Token with specified payload
    const tokenPayload = {
      id: user.id,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '1d' });

    // Send success response (excluding the password)
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export const userController = {
    signupUser, loginUser
}