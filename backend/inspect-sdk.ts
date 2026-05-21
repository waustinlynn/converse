import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function inspect() {
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
    console.log("Connecting...");
    const session = await (genAI as any).live.connect({
        model: "gemini-2.0-flash-exp"
    });
    
    console.log("Session Keys:", Object.keys(session));
    console.log("Session Prototype Keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(session)));
    process.exit(0);
}

inspect();
