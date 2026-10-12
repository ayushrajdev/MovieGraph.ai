// THE UNIVERSAL FLOW (same for every query):
//
//   User Query
//       │
//       ▼
//   ENTITY RESOLUTION (9_entityResolver.js)
//   Extract entity names → search ALL node types in Neo4j
//   "DiCaprio" → Actor "Leonardo DiCaprio"
//   "Action" → Genre "Action"
//       │
//       ▼
//   CLASSIFICATION (10_queryClassifier.js)
//   With resolved entities, decide: graph or similarity?
//   LLM now KNOWS what each entity is — no guessing
//       │
//       ├──────────────────────┐
//       ▼                      ▼
//   GRAPH HANDLER          SIMILARITY HANDLER
//   (11_graphHandler.js)   (12_similarityHandler.js)
//   Neo4j only             Pinecone → Neo4j → LLM
//       │                      │
//       ▼                      ▼
//     Answer                 Answer
//
// =====================================================================

import readline from 'readline';
import { resolveQueryEntities } from './services/entityResolver.js';
import { classifyQuery } from './services/queryClassifier.js';
import { handleGraphQuery } from './query-handlers/graphQueryHandler.js';
import { handleSimilarityQuery } from './query-handlers/similarityQueryHandler.js';
import { closeNeo4jConnections } from './config/neo4j.config.js';
import {
    initializeLangfuse,
    shutdownLangfuse,
    withLangfuseSpan,
} from './config/langfuse.config.js';

async function processQuery(query) {
    return withLangfuseSpan('movie-recommendation.query', { query }, async () => {
        console.log('\n═══════════════════════════════════════════');

        // ── Step 1: Entity Resolution ──
        // Extract entities from query → resolve each in Neo4j
        // After this, we KNOW what "Nolan", "DiCaprio", "Action" etc. are
        console.log('\n🔍 ENTITY RESOLUTION');
        const resolved = await withLangfuseSpan(
            'entity-resolution',
            { query },
            () => resolveQueryEntities(query),
        );

        // ── Step 2: Classification ──
        // With resolved entity context, classify as graph or similarity
        console.log('\n🧠 CLASSIFICATION');
        const classification = await withLangfuseSpan(
            'query-classification',
            { query, entities: resolved.entities },
            () => classifyQuery(query, resolved),
        );
        console.log(
            `   Type: ${classification.type} | Reason: ${classification.reasoning}`,
        );

        // ── Step 3: Route to handler ──
        let answer;

        if (classification.type === 'similarity') {
            console.log('\n📐 → SIMILARITY handler (Pinecone + Neo4j)...');
            answer = await withLangfuseSpan(
                'similarity-query-handler',
                { query, entities: resolved.entities },
                () => handleSimilarityQuery(query, resolved),
            );
        } else {
            console.log('\n🗄️  → GRAPH handler (Neo4j)...');
            answer = await withLangfuseSpan(
                'graph-query-handler',
                { query, entities: resolved.entities },
                () => handleGraphQuery(query, resolved),
            );
        }

        console.log('\n═══════════════════════════════════════════');
        console.log('💬 Answer:\n');
        console.log(answer);
        console.log('\n═══════════════════════════════════════════');
        return answer;
    });
}

async function startCLI() {
    await initializeLangfuse();

    console.log('===========================================');
    console.log('   🎬 GraphRAG Movie Query System');
    console.log('===========================================');
    console.log('Type your question. Type "exit" to quit.\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.setPrompt('🎬 You: ');
    rl.prompt();

    try {
        for await (const input of rl) {
            const query = input.trim();

            if (query.toLowerCase() === 'exit') {
                console.log('\n👋 Goodbye!');
                break;
            }

            if (!query) {
                rl.prompt();
                continue;
            }

            try {
                await processQuery(query);
            } catch (err) {
                console.error('\n❌ Error:', err.message);
            }

            rl.prompt();
        }
    } finally {
        rl.close();
        try {
            await closeNeo4jConnections();
        } finally {
            await shutdownLangfuse();
        }
    }
}

startCLI();
