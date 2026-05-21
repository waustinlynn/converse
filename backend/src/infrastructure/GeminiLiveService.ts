import { GoogleGenAI, Modality } from "@google/genai";
import { ILanguageAIService, AIConnection, AIConnectionConfig } from "../application/interfaces";
import logger from "./logger";

/**
 * Implementation of Language AI using Gemini 3.1 Live API
 */
export class GeminiLiveService implements ILanguageAIService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    async connect(config: AIConnectionConfig): Promise<AIConnection> {
        logger.info("Connecting to Gemini Live API...");

        const historyContext = config.userHistory?.length 
            ? `\n# USER HISTORY\nRecent mission scores: ${config.userHistory.map(h => `${h.missionId}: ${h.score}%`).join(', ')}`
            : "";
        
        const progressContext = config.userProgress 
            ? `\n# USER PROGRESS\nCurrent Mission: ${config.userProgress.current_mission || "Not started"}\nTotal XP: ${config.userProgress.total_xp || 0}`
            : "";

        const mission = config.mission;

        try {
            const session = await (this.ai.live as any).connect({
                model: "gemini-3.1-flash-live-preview",
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: {
                        parts: [{ text: `
# IDENTITY
You are Mateo, a friendly, patient, and encouraging Spanish language mentor. You aren't just a teacher; you're a friend helping the user navigate the language.

# CONTEXT
## Current Topic: ${mission.name}
## Core Concept: ${mission.mission}
## Target Vocabulary/Grammar: ${mission.targetPhrases.join(", ")}
## Mastery Criteria: ${mission.masteryCriteria}
## Friend's Tip: ${mission.promptHint}
${progressContext}${historyContext}

# PEDAGOGICAL STRATEGY: THE MENTOR'S MIX
1. **The Mix**: Use a natural blend of English and Spanish. 
   - For beginners (A0-A1), use 70% English for explanations and 30% Spanish for target phrases and simple chat.
   - Speak like a supportive mentor who wants to see their friend succeed.
2. **Foundational Focus**: Explain *why* certain words are used. 
3. **Casual Corrections**: If the user makes a mistake, don't stop the conversation. Simply say, "Oh, you almost got it! We actually say [Correct Version]. Want to try that again?"
4. **Positive Reinforcement**: Celebrate small wins.

# CONVERSATIONAL RULES
- Keep turns short and conversational. No long lectures.
- Always encourage the user to say at least one thing in Spanish in every turn.
- If the user uses a target word correctly, show genuine excitement.

# PROGRESS TRACKING
When you feel the user has met the **Mastery Criteria** for the current topic, call the \`complete_mission\` tool. This will save their progress and let them move to the next level.
` }]
                    },
                    tools: [
                        {
                            functionDeclarations: [
                                {
                                    name: "complete_mission",
                                    description: "Call this when the user has mastered the current conversational goal.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            summary: { type: "STRING", description: "A brief summary of what the user learned." },
                                            accuracyScore: { type: "NUMBER", description: "Score from 0-100 on their performance." }
                                        },
                                        required: ["summary", "accuracyScore"]
                                    }
                                }
                            ]
                        }
                    ],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        logger.info("SUCCESS: Connected to Gemini Live API");
                    },
                    onmessage: async (msg: any) => {
                        const serverContent = msg.serverContent;
                        
                        // Handle Tool Calls
                        if (msg.toolCall) {
                            const calls = msg.toolCall.functionCalls;
                            for (const call of calls) {
                                logger.info("AI requested tool call", { name: call.name });
                                if (config.onToolCall) {
                                    const result = await config.onToolCall(call.name, call.args);
                                    session.sendToolResponse({
                                        functionResponses: [{
                                            name: call.name,
                                            id: call.id,
                                            response: result
                                        }]
                                    });
                                }
                            }
                        }

                        if (!serverContent) return;

                        if (serverContent.modelTurn?.parts) {
                            serverContent.modelTurn.parts.forEach((part: any) => {
                                if (part.inlineData?.data) {
                                    config.onAudio(part.inlineData.data);
                                }
                            });
                        }

                        if (serverContent.outputTranscription?.text) {
                            logger.info(`Gemini Speech: ${serverContent.outputTranscription.text}`);
                            config.onTranscription(serverContent.outputTranscription.text);
                        }

                        if (serverContent.interrupted) {
                            logger.info("Gemini was interrupted by user");
                            config.onInterrupted();
                        }
                    },
                    onerror: (err: any) => {
                        logger.error("Gemini Live API Error:", err);
                        config.onClose(err.message || "Gemini API Error");
                    },
                    onclose: (event: any) => {
                        logger.info("Gemini Live API Connection Closed", { reason: event.reason });
                        config.onClose(event.reason || "Gemini Session Ended");
                    }
                }
            });

            // Trigger an initial greeting from Mateo
            session.sendClientContent({
                turns: [{ role: "user", parts: [{ text: `¡Hola Mateo! Estoy listo para practicar ${mission.name}.` }] }],
                turnComplete: true
            });

            return {
                sendAudio: async (data: string) => {
                    try {
                        session.sendRealtimeInput({
                            audio: { data, mimeType: "audio/pcm;rate=16000" }
                        });
                    } catch (err) {
                        logger.error("Error sending audio to Gemini:", err);
                    }
                },
                sendToolResponse: (name: string, id: string, response: any) => {
                    session.sendToolResponse({
                        functionResponses: [{ name, id, response }]
                    });
                },
                close: () => {
                    logger.info("Closing Gemini Live session");
                    session.close();
                }
            };
        } catch (error) {
            logger.error("Failed to connect to Gemini Live:", error);
            throw error;
        }
    }
}
