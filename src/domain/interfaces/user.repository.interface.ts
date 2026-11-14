import { User } from "../entities/user.entity";

export interface IUserRepository {
  create(
    user: Omit<User, "id" | "createdAt" | "updatedAt">
    ): Promise<User>;

  findById(id: number): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  findAll(): Promise<User[]>;

  update(id: number, user: Partial<User>): Promise<User>;

  delete(id: number): Promise<void>;

  findUnsyncedUsers(): Promise<User[]>;
}