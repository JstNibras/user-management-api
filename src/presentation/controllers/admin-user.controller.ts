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

    async getUserById(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const id = Number(req.params.id);

            const user = await userService.getUserById(id);

            res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async createUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const user = await userService.createUser(req.body);

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const id = Number(req.params.id);

            const user = await userService.updateUser(id, req.body);

            res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const adminUserController = new AdminUserController();