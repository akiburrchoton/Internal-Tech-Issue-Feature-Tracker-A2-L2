import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/';
import { UserPayload } from '../modules/authentication/auth.interfaces';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(authHeader, config.jwt_secret as string) as UserPayload;
    req.user = decoded; 
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};
