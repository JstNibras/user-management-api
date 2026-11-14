import prisma from "../database/mysql/prisma";
import {
  IUserRepository,
} from "../../domain/interfaces/user.repository.interface";
import {
  User,
  UserRole,
} from "../../domain/entities/user.entity";

export class MySQLUserRepository implements IUserRepository {
    async create(
        user: Omit<User, "id" | "createdAt" | "updatedAt">
    ): Promise<User> {
        const createdUser = await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role,
            },
        });
        return this.toDomain(createdUser);
    }

    async findById(id: number): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        return user ? this.toDomain(user) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        return user ? this.toDomain(user) : null;
    }

    async findAll(): Promise<User[]> {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
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
            },
        });

        return this.toDomain(updatedUser);
    }

    async delete(id: number): Promise<void> {
        await prisma.user.delete({
            where: { id },
        });
    }

    private toDomain(user: {
        id: number;
        name: string;
        email: string;
        password: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role as UserRole,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}