import { neon } from '@netlify/neon';

/**
 * Netlify Serverless Function for GMD Store
 * Connects to Neon Postgres Database
 */
export const handler = async (event: any) => {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database URL not configured" }) };
  }

  const sql = neon(databaseUrl);

  // Initialize table if it doesn't exist
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS gmd_store_data (
        key TEXT PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (e) {
    console.error("Table init error", e);
  }

  const { httpMethod, queryStringParameters } = event;
  const type = queryStringParameters?.type;

  try {
    if (httpMethod === 'GET' && type) {
      const rows = await sql`SELECT value FROM gmd_store_data WHERE key = ${type}`;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows[0]?.value || [])
      };
    }

    if (httpMethod === 'POST' && type) {
      const data = JSON.parse(event.body);
      await sql`
        INSERT INTO gmd_store_data (key, value, updated_at)
        VALUES (${type}, ${data}, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = ${data}, updated_at = CURRENT_TIMESTAMP
      `;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, body: "Invalid Request" };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};