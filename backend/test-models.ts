import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const models = [
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-live-preview",
    "gemini-2.0-flash-live",
    "gemini-2.0-flash"
];

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });

    for (const model of models) {
        console.log(`Testing model: ${model}...`);
        try {
            const session = await (ai.live as any).connect({
                model,
                config: { responseModalities: [Modality.AUDIO] },
                callbacks: {
                    onopen: () => console.log(`SUCCESS: Connected to ${model}`),
                    onmessage: (msg: any) => console.log(`MSG from ${model}:`, JSON.stringify(msg).substring(0, 100)),
                    onerror: (err: any) => console.log(`ERROR from ${model}:`, err.message),
                    onclose: (e: any) => console.log(`CLOSE from ${model}:`, e.reason)
                }
            });
            console.log(`Session established for ${model}`);
            await new Promise(r => setTimeout(r, 2000));
            session.close();
        } catch (err: any) {
            console.log(`FAILED to connect to ${model}:`, err.message);
        }
        console.log("-------------------");
    }
}

test();
