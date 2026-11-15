import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/app-error";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

const tokenService = new JwtTokenService();

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = tokenService.verifyToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, "Invalid or expired token"));
  }
};