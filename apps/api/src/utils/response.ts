import { Response } from "express";

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  status = 200
) {
  return res.status(status).json({
    success: true,
    message,
    data,
  } as ApiSuccess<T>);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status = 400
) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  } as ApiError);
}
