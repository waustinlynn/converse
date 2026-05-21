import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function listModels() {
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
    console.log("Models:", JSON.stringify(models, null, 2));
    process.exit(0);
}

listModels().catch(console.error);
