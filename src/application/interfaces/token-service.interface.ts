import { UserRole } from "../../domain/entities/user.entity";

export interface TokenPayload {
  userId: number;
  role: UserRole;
}

export interface ITokenService {
  generateToken(payload: TokenPayload): string;

  verifyToken(token: string): TokenPayload;
}