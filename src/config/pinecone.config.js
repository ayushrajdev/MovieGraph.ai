

// =====================================================================
//  PINECONE
// =====================================================================
// Pinecone() = the client
// pinecone.index() = points to one specific index (like a table)

import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });


export const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);