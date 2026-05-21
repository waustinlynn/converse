import { LiveServerMessage } from "@google/genai";

/**
 * Interface for AI Language Service
 * Decouples the application from the specific AI provider (SOLID)
 */
export interface ILanguageAIService {
    connect(config: AIConnectionConfig): Promise<AIConnection>;
}

export interface Mission {
    id: string;
    stage: number;
    level: string;
    name: string;
    mission: string;
    targetPhrases: string[];
    culturalNote: string;
    promptHint: string;
}

export interface AIConnectionConfig {
    mission: Mission;
    userProgress?: any;
    userHistory?: any[];
    onAudio: (data: string) => void;
    onTranscription: (text: string) => void;
    onInterrupted: () => void;
    onClose: (reason?: string) => void;
    onToolCall?: (functionName: string, args: any) => Promise<any>;
}

export interface AIConnection {
    sendAudio(data: string): Promise<void>;
    sendToolResponse(functionName: string, id: string, response: any): void;
    close(): void;
}

/**
 * Interface for Progress Repository
 * Abstraction for database interactions (Single-Table Design)
 */
export interface IUserRepository {
    getUserMetadata(userId: string): Promise<any>;
    updateUserMetadata(userId: string, metadata: any): Promise<void>;
    
    getLanguageProgress(userId: string, langId: string): Promise<any>;
    updateLanguageProgress(userId: string, langId: string, progress: any): Promise<void>;
    
    saveMissionResult(userId: string, missionId: string, result: any): Promise<void>;
    getMissionResults(userId: string, limit?: number): Promise<any[]>;
    
    updateResumptionHandle(userId: string, handle: string): Promise<void>;
    getResumptionHandle(userId: string): Promise<string | null>;
}
