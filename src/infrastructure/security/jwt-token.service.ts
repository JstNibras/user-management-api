import jwt from "jsonwebtoken";
import {
  ITokenService,
  TokenPayload,
} from "../../application/interfaces/token-service.interface";

export class JwtTokenService implements ITokenService {
    private readonly secret: string;

    constructor() {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }

        this.secret = secret;
    }

    generateToken(payload: TokenPayload): string {
        return jwt.sign(payload, this.secret, {
            expiresIn: "1d",
        });
    }

    verifyToken(token: string): TokenPayload {
        return jwt.verify(token, this.secret) as TokenPayload;
    }
}