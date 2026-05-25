import { CognitoJwtVerifier } from "aws-jwt-verify";
import logger from "./logger";

export interface AuthUser {
    id: string;
    email?: string;
}

export class AuthService {
    private verifier: CognitoJwtVerifier<any, any, any>;

    constructor(userPoolId: string, clientId: string) {
        this.verifier = CognitoJwtVerifier.create({
            userPoolId: userPoolId,
            tokenUse: "access",
            clientId: clientId,
        });
    }

    async verifyToken(token: string): Promise<AuthUser | null> {
        try {
            const payload = await this.verifier.verify(token);
            return {
                id: payload.sub,
                email: payload.username as string, // Access tokens often have username which is usually email/sub
            };
        } catch (error) {
            logger.error("Token verification failed:", error);
            return null;
        }
    }
}
