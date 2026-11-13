export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}