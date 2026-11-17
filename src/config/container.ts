import { MySQLUserRepository } from "../infrastructure/repositories/mysql-user.repository";
import { MongoDBUserSyncRepository } from "../infrastructure/repositories/mongodb-user-sync.repository";
import { BcryptPasswordHasher } from "../infrastructure/security/bcrypt-password-hasher";
import { UserService } from "../application/services/user.service";
import { JwtTokenService } from "../infrastructure/security/jwt-token.service";

const userRepository = new MySQLUserRepository();

const userSyncRepository = new MongoDBUserSyncRepository();

const passwordHasher = new BcryptPasswordHasher();

const tokenService = new JwtTokenService();

export const userService = new UserService(
  userRepository,
  userSyncRepository,
  passwordHasher,
  tokenService,
);