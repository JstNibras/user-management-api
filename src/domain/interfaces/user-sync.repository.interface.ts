import { UserRole } from "../entities/user.entity";

export interface UserSyncData {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface IUserSyncRepository {
  sync(user: UserSyncData): Promise<void>;

  delete(userId: number): Promise<void>;
}