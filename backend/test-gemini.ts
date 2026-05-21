import { GeminiLiveService } from "./src/infrastructure/GeminiLiveService";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found");
        return;
    }

    console.log("Starting Gemini Live Integration Test...");
    const service = new GeminiLiveService(apiKey);

    try {
        const connection = await service.connect({
            category: "Basics",
            onAudio: (audio) => {
                console.log("SUCCESS: Received audio data from Gemini (Base64 length):", audio.length);
            },
            onTranscription: (text) => {
                console.log("SUCCESS: Received transcription:", text);
            },
            onInterrupted: () => {
                console.log("INFO: AI was interrupted");
            }
        });

        console.log("Session connected. Sending greeting...");
        
        // Give it a moment then send a voice prompt (simulated via text)
        setTimeout(async () => {
            console.log("Sending: ¡Hola Mateo!");
            await connection.sendAudio("Hello"); // This will fail if not PCM, but let's see
        }, 2000);

        setTimeout(() => {
            console.log("Test finished.");
            process.exit(0);
        }, 15000);

    } catch (err) {
        console.error("TEST FAILED:", err);
    }
}

test();
