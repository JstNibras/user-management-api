import { User, UserRole } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/interfaces/user.repository.interface";
import { IUserSyncRepository } from "../../domain/interfaces/user-sync.repository.interface";
import { IPasswordHasher } from "../interfaces/password-hasher.interface";
import { AppError } from "../../utils/app-error";
import { ITokenService } from "../interfaces/token-service.interface";

export class UserService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userSyncRepository: IUserSyncRepository,
        private readonly passwordHasher: IPasswordHasher,
        private readonly tokenService: ITokenService,
    ) {}

    async register(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<Omit<User, "password">> {
        const existingUser = await this.userRepository.findByEmail(
            data.email
        );

        if (existingUser) {
            throw new AppError(409, "Email already registered");
        }

        const hashedPassword = await this.passwordHasher.hash(
            data.password
        );

        const createdUser = await this.userRepository.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: UserRole.USER,
            mongoSynced: false,
            isDeleted: false,
        });

        try {
            await this.userSyncRepository.sync({
                userId: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                isDeleted: createdUser.isDeleted,
            });
        } catch (error) {
            console.error("MongoDB synchronization failed:", error);

            const { password, ...safeUser } = createdUser;
            return safeUser;
        }

        try {
            const syncedUser = await this.userRepository.update(
                createdUser.id,
                { mongoSynced: true }
            );

            const { password, ...safeUser } = syncedUser;
            return safeUser;
        } catch (error) {
            console.error(
                "MongoDB synced, but MySQL sync status update failed:",
                error
            );

            const { password, ...safeUser } = createdUser;
            return safeUser;
        }
    }

    async syncPendingUsers(): Promise<void> {
        const pendingUsers = await this.userRepository.findUnsyncedUsers();

        for (const user of pendingUsers) {
            try {
                await this.userSyncRepository.sync({
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isDeleted: user.isDeleted,
                });

                await this.userRepository.update(user.id, {
                    mongoSynced: true,
                });

                console.log(`User ${user.id} synchronized successfully`);
            } catch (error) {
                console.error(
                    `Failed to synchronize user ${user.id}:`,
                    error
                );
            }
        }
    }

    async login(data: {
        email: string;
        password: string;
    }): Promise<{
        user: Omit<User, "password">;
        token: string;
    }> {
        const existingUser = await this.userRepository.findByEmail(
            data.email
        );

        if (!existingUser) {
            throw new AppError(401, "Invalid email or password");
        }

        const isPasswordValid = await this.passwordHasher.compare(
            data.password,
            existingUser.password
        );

        if (!isPasswordValid) {
            throw new AppError(401, "Invalid email or password");
        }

        const token = this.tokenService.generateToken({
            userId: existingUser.id,
            role: existingUser.role,
        });

        const { password, ...safeUser } = existingUser;

        return {
            user: safeUser,
            token,
        };
    }
}