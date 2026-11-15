import { Request, Response, NextFunction } from "express";
import { userService } from "../../config/container";
import { authCookieOptions } from "../../config/cookie.config";

export class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await userService.register(req.body);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.login(req.body);

      res.cookie("token", result.token, authCookieOptions);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();