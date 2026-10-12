/**
 * Extract one batch of movies from the uploaded PDF.
 * Retries up to maxRetries times on ANY error (not just 429).
 *
 * WHY retry everything?
 *   - 429 → rate limit (wait longer)
 *   - JSON parse error → Gemini returned markdown/garbage (retry often fixes it)
 *   - Network timeout → transient (retry fixes it)
 *   - 500/503 → server overload (retry fixes it)
 */

import { createPartFromUri } from "@google/genai";
import { genai } from "../config/llm.config.js";

export const EXTRACTION_PROMPT = `You are a precise entity extractor for a movie knowledge graph.

From the attached PDF, extract movies {START} through {END} (by their order in the document).

For EACH movie, output this EXACT JSON structure:
{
  "movie": {"title": "string", "year": number},
  "director": {"name": "string"},
  "actors": ["string"],
  "genres": ["string"],
  "themes": ["string"],
  "awards": ["string"]
}

Rules:
- If awards say "None", return awards as empty array []
- Keep exact names as written in the PDF
- Year must be a number, not string
- Return a JSON ARRAY of objects: [{...}, {...}, ...]
- Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

export async function extractBatch(fileInfo, start, end, attempt = 1) {
    const maxRetries = 3;
    const prompt = EXTRACTION_PROMPT.replace('{START}', start).replace(
        '{END}',
        end,
    );

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: [
                {
                    role: 'user',
                    parts: [
                        createPartFromUri(fileInfo.uri, fileInfo.mimeType),
                        { text: prompt },
                    ],
                },
            ],
        });

        let raw = response.text.trim();
        raw = raw
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
        // If we have retries left → wait and try again
        if (attempt < maxRetries) {
            const is429 = err.message?.includes('429');
            const wait = is429 ? attempt * 30 : attempt * 10;
            const reason = is429 ? 'Rate limited' : 'Error';
            console.warn(
                `   ⚠️ ${reason}. Waiting ${wait}s (retry ${attempt + 1}/${maxRetries})...`,
            );
            await new Promise((r) => setTimeout(r, wait * 1000));
            return extractBatch(fileInfo, start, end, attempt + 1);
        }

        // All retries exhausted → return empty (will be tracked as failed)
        console.error(
            `   ❌ Batch ${start}-${end} FAILED after ${maxRetries} attempts:`,
            err.message?.substring(0, 150),
        );
        return [];
    }
}
