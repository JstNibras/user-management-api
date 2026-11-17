import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/app-error";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { userService } from "../../config/container";

const tokenService = new JwtTokenService();

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = tokenService.verifyToken(token);

    const activeUser = await userService.getActiveUserForAuth(
      payload.userId
    );

    req.user = {
      userId: activeUser.userId,
      role: activeUser.role,
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