import prisma from "../database/mysql/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import {
  IUserRepository,
} from "../../domain/interfaces/user.repository.interface";
import {
  User,
  UserRole,
} from "../../domain/entities/user.entity";
import { error } from "node:console";

export class MySQLUserRepository implements IUserRepository {
    async create(
        user: Omit<User, "id" | "createdAt" | "updatedAt">
    ): Promise<User> {
        try {
            const createdUser = await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    role: user.role,
                    mongoSynced: false,
                    isDeleted: user.isDeleted,
                },
            });
        return this.toDomain(createdUser);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new AppError(409, "Email already registered");
            }

            throw error; 
        }
    }

    async findById(id: number): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user || user.isDeleted) {
            return null;
        }

        return this.toDomain(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.isDeleted) {
            return null;
        }

        return this.toDomain(user);
    }

    async findAll(): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
        });

        return users.map((user) => this.toDomain(user));
    }

    async findUnsyncedUsers(): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                mongoSynced: false,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return users.map((user) => this.toDomain(user));
    }

    async update(
        id: number,
        user: Partial<User>
    ): Promise<User> {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(user.name !== undefined && { name: user.name }),
                ...(user.email !== undefined && { email: user.email }),
                ...(user.password !== undefined && { password: user.password }),
                ...(user.role !== undefined && { role: user.role }),
                ...(user.mongoSynced !== undefined && {
                    mongoSynced: user.mongoSynced,
                }),
            },
        });

        return this.toDomain(updatedUser);
    }

    async delete(id: number): Promise<void> {
        await prisma.user.update({
            where: { id },
            data: {
                isDeleted: true,
                mongoSynced: false,
            },
        });
    }

    private toDomain(user: {
        id: number;
        name: string;
        email: string;
        password: string;
        role: string;
        mongoSynced: boolean;
        isDeleted: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role as UserRole,
            mongoSynced: user.mongoSynced,
            isDeleted: user.isDeleted,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}