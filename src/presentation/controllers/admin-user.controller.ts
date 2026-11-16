import { Request, Response, NextFunction } from "express";
import { userService } from "../../config/container";

export class AdminUserController {
    async getAllUsers(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
        const result = await userService.getAllUsers(
            res.locals.validatedQuery
        );

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result.users,
            pagination: result.pagination,
        });
        } catch (error) {
        next(error);
        }
    }
}

export const adminUserController = new AdminUserController();