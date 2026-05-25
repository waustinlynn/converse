import express from "express";
import path from "path";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { GeminiLiveService } from "./infrastructure/GeminiLiveService";
import { RealtimeConnectionHandler } from "./api/RealtimeHandler";
import { DynamoDBRepository } from "./infrastructure/DynamoDBRepository";
import { AuthService } from "./infrastructure/AuthService";

dotenv.config({ path: path.join(process.cwd(), '../.env') });

import http from "http";
import logger from "./infrastructure/logger";

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
});

async function bootstrap() {
    // 1. Dependency Injection (Infrastructure -> API)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        logger.error("FATAL: GEMINI_API_KEY is not set in environment variables.");
        process.exit(1);
    }
    
    const userRepo = new DynamoDBRepository();
    await userRepo.createTableIfNotExists();

    const authService = new AuthService(
        process.env.COGNITO_USER_POOL_ID!,
        process.env.COGNITO_USER_POOL_CLIENT_ID!
    );

    const geminiService = new GeminiLiveService(apiKey);
    const realtimeHandler = new RealtimeConnectionHandler(geminiService, userRepo);

    // 2. HTTP Middlewares
    app.get("/api/health", (_, res) => res.json({ status: "ok" }));

    // 3. Vite Integration (Dynamic import to avoid production overhead)
    if (process.env.NODE_ENV !== "production") {
        logger.info("Initializing Vite middleware...");
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true, hmr: false },
            appType: "spa",
            root: path.join(process.cwd(), '../ui')
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), '../ui/dist');
        app.use(express.static(distPath));
        app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
    }

    // 4. WebSocket Entry Point
    logger.info("Initializing WebSocket server at /ws/live");
    const wss = new WebSocketServer({ server, path: "/ws/live" });
    
    wss.on("connection", async (ws, req) => {
        // Extract token from Sec-WebSocket-Protocol header (common for frontend clients)
        // or from a query parameter.
        const protocol = req.headers['sec-websocket-protocol'];
        const token = Array.isArray(protocol) ? protocol[0] : protocol;

        if (!token) {
            logger.warn("WebSocket connection attempt without token");
            ws.close(1008, "Policy Violation: Authentication Required");
            return;
        }

        const user = await authService.verifyToken(token);
        if (!user) {
            logger.warn("WebSocket connection attempt with invalid token");
            ws.close(1008, "Policy Violation: Invalid Token");
            return;
        }

        logger.info(`Client authenticated: ${user.id}`);
        realtimeHandler.handle(ws, user.id);
    });

    server.listen(PORT, "0.0.0.0", () => {
        logger.info(`Habla Local running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
    });
}

bootstrap().catch(console.error);
