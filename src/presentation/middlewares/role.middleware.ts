import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../../domain/entities/user.entity";
import { AppError } from "../../utils/app-error";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(new AppError(403, "Access forbidden"));
      return;
    }

    next();
  };
};