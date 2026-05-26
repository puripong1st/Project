// scratch_migrate.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Pool } = require("pg");

const connectionString = "postgres://postgres.wvuvdnutidctmyojacrn:0CXFSbjybuigR79a@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function migrate() {
  console.log("Connecting to Supabase PostgreSQL database...");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

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
