import express from "express";
import path from "path";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { GeminiLiveService } from "./infrastructure/GeminiLiveService";
import { RealtimeConnectionHandler } from "./api/RealtimeHandler";
import { DynamoDBRepository } from "./infrastructure/DynamoDBRepository";

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
    wss.on("connection", (ws) => {
        logger.info("Client WebSocket connection established");
        realtimeHandler.handle(ws);
    });

    server.listen(PORT, "0.0.0.0", () => {
        logger.info(`Habla Local running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
    });
}

bootstrap().catch(console.error);
