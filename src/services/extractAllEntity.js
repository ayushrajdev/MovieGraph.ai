import { uploadPDF } from './uploadPdf.js';
import { extractBatch } from './extractBatch.js';
import { genai } from '../config/llm.config.js';

async function extractAllEntities(pdfPath, totalMovies = 1000, batchSize = 50) {
    // Upload PDF once
    const fileInfo = await uploadPDF(pdfPath);

    const allBatches = [];
    const totalBatches = Math.ceil(totalMovies / batchSize);

    // Build batch list
    for (let i = 0; i < totalBatches; i++) {
        allBatches.push({
            start: i * batchSize + 1,
            end: Math.min((i + 1) * batchSize, totalMovies),
        });
    }

    // ── PASS 1: Run 5 batches in parallel ──
    const CONCURRENCY = 5;
    const results = [];
    const failedBatches = [];

    console.log(
        `\n   📊 Pass 1: Extracting ${totalBatches} batches (${CONCURRENCY} parallel)...\n`,
    );

    for (let i = 0; i < allBatches.length; i += CONCURRENCY) {
        const chunk = allBatches.slice(i, i + CONCURRENCY);
        const roundNum = Math.floor(i / CONCURRENCY) + 1;
        const totalRounds = Math.ceil(allBatches.length / CONCURRENCY);

        console.log(
            `🤖 Round ${roundNum}/${totalRounds}: Movies ${chunk[0].start}-${chunk[chunk.length - 1].end}...`,
        );

        // Fire all 5 requests at the same time
        const promises = chunk.map((batch) =>
            extractBatch(fileInfo, batch.start, batch.end).then((res) => ({
                batch,
                results: res,
            })),
        );

        const batchResults = await Promise.all(promises);

        for (const { batch, results: res } of batchResults) {
            if (res.length > 0) {
                results.push(...res);
            } else {
                failedBatches.push(batch);
            }
        }

        console.log(`   ✅ Total so far: ${results.length} movies`);

        // Small 2s breather between rounds (not strictly needed, just polite)
        if (i + CONCURRENCY < allBatches.length) {
            await new Promise((r) => setTimeout(r, 2000));
        }
    }

    // ── PASS 2: Retry failed batches (sequentially, with delay) ──
    if (failedBatches.length > 0) {
        console.log(
            `\n   🔄 Pass 2: Retrying ${failedBatches.length} failed batches...\n`,
        );
        await new Promise((r) => setTimeout(r, 5000));

        for (const batch of failedBatches) {
            console.log(`🔄 Retrying movies ${batch.start}-${batch.end}...`);

            const batchResults = await extractBatch(
                fileInfo,
                batch.start,
                batch.end,
            );

            if (batchResults.length > 0) {
                results.push(...batchResults);
                console.log(
                    `   ✅ Retry success! Got ${batchResults.length} movies (total: ${results.length})`,
                );
            } else {
                console.error(
                    `   ❌ Movies ${batch.start}-${batch.end} permanently failed.`,
                );
            }

            await new Promise((r) => setTimeout(r, 2000));
        }
    }

    // Cleanup uploaded file
    try {
        await genai.files.delete({ name: fileInfo.name });
        console.log('   🗑️ PDF deleted from Gemini servers');
    } catch (e) {
        /* auto-deletes in 48h anyway */
    }

    console.log(
        `\n✅ Total extracted: ${results.length}/${totalMovies} movies`,
    );
    if (results.length < totalMovies) {
        console.warn(
            `⚠️ ${totalMovies - results.length} movies missing. You can re-run indexing to fill gaps.`,
        );
    }

    return results;
}

export { extractAllEntities, };
