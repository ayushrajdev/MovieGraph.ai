import { GoogleGenAI } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getLangfuseCallbackHandler } from "./langfuse.config.js";

export const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-3.1-flash-lite',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
});

export function invokeLlm(messages, runName) {
    const callbackHandler = getLangfuseCallbackHandler();
    const config = { runName };

    if (callbackHandler) {
        config.callbacks = [callbackHandler];
    }

    return llm.invoke(messages, config);
}

// =====================================================================
// 4. GOOGLE GENAI SDK (needed for embeddings + PDF file uploads)
// =====================================================================
// Must be initialized BEFORE embedText/embedTexts functions below.
// Used by: embeddings (this file), PDF upload (4_entityExtractor.js)
// =====================================================================
export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// =====================================================================
// 5. GEMINI EMBEDDINGS (via @google/genai SDK)
// =====================================================================
// text-embedding-004 → SHUT DOWN Jan 14, 2026. Dead.
// gemini-embedding-001 → only model alive. 3072 dimensions default.
//
// Pinecone free tier limit = 2GB storage (NOT dimension limit!)
// 1000 movies × 3072 dims × 4 bytes = ~12MB → fits easily in 2GB
//
// So we use FULL 3072 dimensions — no reduction needed!
// Better quality than 768, and Pinecone handles it fine.
//
// WHY @google/genai SDK instead of LangChain?
// LangChain's GoogleGenerativeAIEmbeddings has a bug —
// it ignores outputDimensionality param. But since we're using
// full 3072 (default), this doesn't matter. We use SDK anyway
// because it's simpler and we already need it for PDF file uploads.
// =====================================================================

// Embed ONE text → returns 3072-dim vector
export async function embedText(text) {
    const response = await genai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
    });
    // response.embeddings is an ARRAY (even for single text)
    // Each element has .values (the actual vector)
    return response.embeddings[0].values;
}

// Embed MULTIPLE texts → returns array of 3072-dim vectors
export async function embedTexts(texts) {
    const response = await genai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: texts,
    });
    return response.embeddings.map((e) => e.values);
}
