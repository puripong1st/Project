// scratch_inspect_tokens.js
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { parse } = require("pg-connection-string");

// Load .env.local manually if it exists
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const firstEq = trimmed.indexOf("=");
    if (firstEq === -1) return;
    const key = trimmed.substring(0, firstEq).trim();
    let val = trimmed.substring(firstEq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  });
}

const connectionString = process.env.POSTGRES_URL;

async function inspect() {
  if (!connectionString) {
    console.error("Error: POSTGRES_URL environment variable is not defined.");
    process.exit(1);
  }

  const connectionConfig = parse(connectionString);
  connectionConfig.ssl = { rejectUnauthorized: false };

  const pool = new Pool(connectionConfig);

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
