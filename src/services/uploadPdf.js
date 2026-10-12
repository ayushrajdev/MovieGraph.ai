import { genai } from "../config/llm.config.js";

/**
 * Upload PDF to Gemini Files API.
 * File stays on Google servers for 48 hours.
 */
export async function uploadPDF(pdfPath) {
    console.log('   📤 Uploading PDF to Gemini Files API...');

    const file = await genai.files.upload({
        file: pdfPath,
        config: { mimeType: 'application/pdf' },
    });

    // Wait until processing completes
    let fileInfo = await genai.files.get({ name: file.name });
    while (fileInfo.state === 'PROCESSING') {
        console.log('   ⏳ PDF processing...');
        await new Promise((r) => setTimeout(r, 3000));
        fileInfo = await genai.files.get({ name: file.name });
    }

    if (fileInfo.state === 'FAILED') {
        throw new Error('PDF upload processing failed');
    }

    console.log(`   ✅ PDF uploaded: ${file.name}`);
    return fileInfo;
}
