import { WebSocket } from "ws";
import { ILanguageAIService, AIConnection, IUserRepository, Mission } from "../application/interfaces";
import missionsData from "../domain/missions.json";
import logger from "../infrastructure/logger";

const missions = missionsData as Mission[];

/**
 * API Handler for WebSockets
 * Coordinates between the network layer and Application services
 */
export class RealtimeConnectionHandler {
    constructor(
        private aiService: ILanguageAIService,
        private userRepo: IUserRepository
    ) {}

    handle(ws: WebSocket) {
        logger.debug("New client connected to WebSocket");
        let aiSession: AIConnection | null = null;
        const userId = "mock-user-1"; // TODO: Replace with real user ID from JWT

        ws.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString());

                if (message.type === "setup") {
                    const missionId = message.category || "basics-greetings";
                    const mission = missions.find(m => m.id === missionId) || missions[0];

                    logger.info(`Setting up AI session for user ${userId} and mission: ${mission.name}`);

                    // Fetch user history to enhance the prompt
                    const progress = await this.userRepo.getLanguageProgress(userId, "SPANISH");
                    const history = await this.userRepo.getMissionResults(userId, 3);

                    aiSession = await this.aiService.connect({
                        mission,
                        userProgress: progress,
                        userHistory: history,
                        onAudio: (audio) => {
                            logger.debug("Forwarding AI audio chunk to client");
                            ws.send(JSON.stringify({ type: "audio", audio }));
                        },
                        onTranscription: (text) => {
                            logger.info(`AI Transcription: ${text}`);
                            ws.send(JSON.stringify({ type: "transcription", text }));
                        },
                        onInterrupted: () => {
                            logger.info("AI interrupted by user");
                            ws.send(JSON.stringify({ type: "interrupted" }));
                        },
                        onClose: (reason) => {
                            logger.info("AI session closed, notifying client", { reason });
                            ws.send(JSON.stringify({ type: "closed", reason }));
                            ws.close();
                        },
                        onToolCall: async (name, args) => {
                            if (name === "complete_mission") {
                                logger.info("Mission completed triggered by AI", { userId, missionId, args });
                                
                                // Save the result to DynamoDB
                                await this.userRepo.saveMissionResult(userId, missionId, {
                                    summary: args.summary,
                                    score: args.accuracyScore
                                });

                                // Calculate XP (e.g., 100 XP for completion + score bonus)
                                const xpAwarded = 100 + (args.accuracyScore || 0);
                                const newProgress = {
                                    current_mission: missionId,
                                    total_xp: (progress?.total_xp || 0) + xpAwarded,
                                    last_completed: missionId
                                };

                                await this.userRepo.updateLanguageProgress(userId, "SPANISH", newProgress);
                                
                                // Notify client of achievement
                                ws.send(JSON.stringify({ 
                                    type: "achievement", 
                                    xp: xpAwarded,
                                    summary: args.summary 
                                }));

                                return { success: true, message: "Progress recorded in DynamoDB" };
                            }
                            return { success: false, error: "Tool not found" };
                        }
                    });
                    ws.send(JSON.stringify({ type: "ready" }));
                } else if (message.type === "audio" && aiSession) {
                    aiSession.sendAudio(message.audio);
                }
            } catch (error) {
                logger.error("RealtimeHandler Error:", error);
            }
        });

        ws.on("close", () => {
            logger.info("Client disconnected, closing AI session");
            aiSession?.close();
        });
    }
}
