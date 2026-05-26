// scratch_migrate.js
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

async function migrate() {
  if (!connectionString) {
    console.error("Error: POSTGRES_URL environment variable is not defined.");
    process.exit(1);
  }

  console.log("Connecting to Supabase PostgreSQL database...");
  const connectionConfig = parse(connectionString);
  connectionConfig.ssl = { rejectUnauthorized: false };

  const pool = new Pool(connectionConfig);

  try {
    console.log("Running Alter Table migrations to ensure all columns exist...");
    
    // 1. Alter students table
    console.log("Altering students table...");
    await pool.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS requested_room VARCHAR(50) NOT NULL DEFAULT 'default';
    `);
    await pool.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS bypass_token VARCHAR(64) DEFAULT NULL;
    `);

    // 2. Alter access_logs table
    console.log("Altering access_logs table...");
    await pool.query(`
      ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS room_code VARCHAR(50) NOT NULL DEFAULT 'default';
    `);

    // 3. Alter dynamic_qr_tokens table
    console.log("Altering dynamic_qr_tokens table...");
    await pool.query(`
      ALTER TABLE dynamic_qr_tokens ADD COLUMN IF NOT EXISTS room_code VARCHAR(50) NOT NULL DEFAULT 'default';
    `);

    console.log("Checking tables structure...");
    const { rows: columns } = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('students', 'access_logs', 'dynamic_qr_tokens')
      ORDER BY table_name, column_name;
    `);
    console.log("Current Database Columns:");
    console.table(columns);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
