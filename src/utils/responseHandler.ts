import { Response } from 'express';

// Standardized Success Response Utility
export const sendSuccess = (
  res: Response, 
  message: string, 
  data?: any, 
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data })
  });
};

// Standardized Error Response Utility
export const sendError = (
  res: Response, 
  message: string, 
  statusCode: number = 500,
  errorDetails?: any
): void => {
  if (statusCode === 500 && errorDetails) {
    console.error(`💥 Server Error Context:`, errorDetails);
  }
  res.status(statusCode).json({
    success: false,
    message
  });
};
