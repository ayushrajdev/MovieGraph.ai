import neo4j from 'neo4j-driver';


// neo4j.driver() creates a connection pool (not single connection)
// neo4j+s:// = Bolt protocol with TLS (required for Aura cloud)
// =====================================================================
export const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
);

// Close all connections when done
export async function closeNeo4jConnections() {
    await driver.close();
    console.log('✅ All connections closed.');
}
