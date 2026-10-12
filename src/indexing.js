// =====================================================================
// indexing.js
// RUNS THE COMPLETE INDEXING PIPELINE
// =====================================================================
//
// FLOW:
//
// Step 1: Upload PDF to Gemini
//         Extract movie entities in batches
//
// Step 2: Build Neo4j graph
//
// Step 3: Build Pinecone vector store
//
// =====================================================================
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { extractAllEntities } from './services/extractAllEntity.js';
import { buildGraph } from './services/createNeo4jGraph.js';
import { buildVectorStore } from './services/vectorStore.js';
import { closeNeo4jConnections } from './config/neo4j.config.js';
import fs from 'node:fs/promises';
import entities from '../data/entities.json' with { type: 'json' };
import { pineconeIndex } from './config/pinecone.config.js';

// ---------------------------------------------------------------------
// __dirname equivalent for ES Modules
// ---------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------
// Resolve PDF path safely
//
// indexing.js -> ../data/movies.pdf
// ---------------------------------------------------------------------

const pdfPath = path.resolve(__dirname, '../data/movies.pdf');

console.log(pdfPath);

// ---------------------------------------------------------------------
// Main indexing pipeline
// ---------------------------------------------------------------------

async function runIndexing(pdfPath) {
    console.log('===========================================');
    console.log('       🎬 GraphRAG Indexing Pipeline');
    console.log('===========================================\n');

    const startTime = Date.now();

    try {
        // ---------------------------------------------------------------
        // Validate PDF
        // ---------------------------------------------------------------

        // if (!existsSync(pdfPath)) {
        //     throw new Error(`PDF not found: ${pdfPath}`);
        // }

        // console.log(`📄 PDF: ${pdfPath}\n`);

        // ---------------------------------------------------------------
        // STEP 1
        // Upload PDF + Extract Entities
        // ---------------------------------------------------------------

        // console.log('── STEP 1: Extracting Entities (Gemini + PDF Upload) ──');

        // const entities = await extractAllEntities(pdfPath);

        // await fs.writeFile(
        //     path.resolve('./data/entities.json'),
        //     JSON.stringify(entities, null, 2),
        //     'utf-8',
        // );

        // console.log('💾 Entities saved to data/entities.json');

        // console.log(
        //     `✅ Entity extraction completed. Total entities: ${
        //         entities?.length ?? 0
        //     }\n`,
        // );

        // ---------------------------------------------------------------
        // STEP 2
        // Build Neo4j Graph
        // ---------------------------------------------------------------

        // console.log('── STEP 2: Building Graph (Neo4j) ──');

        // await buildGraph(entities);

        // console.log('✅ Neo4j graph created successfully.\n');

        // ---------------------------------------------------------------
        // STEP 3
        // Build Pinecone Vector Store
        // ---------------------------------------------------------------
        await pineconeIndex.deleteAll()
        console.log(entities.length)
        console.log('── STEP 3: Building Vector Store (Pinecone) ──');

        await buildVectorStore(entities);

        console.log('✅ Pinecone vector store created successfully.\n');

        // ---------------------------------------------------------------
        // DONE
        // ---------------------------------------------------------------

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('===========================================');
        console.log(`   ✅ Indexing complete in ${elapsed}s`);
        console.log('===========================================');
    } catch (err) {
        console.error('\n❌ Indexing failed:');
        console.error(err.message);
        console.error('\nStack:');
        console.error(err.stack);

        // Important:
        // exit code 1 tells the shell/CI that indexing failed.
        process.exitCode = 1;
    } finally {
        try {
            await closeNeo4jConnections();
            console.log('\n🔌 Connections closed.');
        } catch (closeError) {
            console.error(
                '⚠️ Failed to close connections:',
                closeError.message,
            );
        }
    }
}

// ---------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------

runIndexing(pdfPath);
