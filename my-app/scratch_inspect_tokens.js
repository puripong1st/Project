// scratch_inspect_tokens.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Pool } = require("pg");

const connectionString = "postgres://postgres.wvuvdnutidctmyojacrn:0CXFSbjybuigR79a@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function inspect() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Fetching recent tokens from dynamic_qr_tokens...");
    const { rows: tokens } = await pool.query(`
      SELECT id, token, room_code, created_at, is_consumed,
             (created_at >= CURRENT_TIMESTAMP - INTERVAL '300 seconds') as is_unexpired
      FROM dynamic_qr_tokens
      ORDER BY created_at DESC LIMIT 10;
    `);
    console.table(tokens);
  } catch (error) {
    console.error("Failed to inspect:", error);
  } finally {
    await pool.end();
  }
}

inspect();
