// scratch/check-webhooks.js
const { Pool } = require('pg');

const connectionString = "postgres://postgres.wvuvdnutidctmyojacrn:0CXFSbjybuigR79a@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const { rows } = await pool.query("SELECT * FROM system_settings WHERE setting_key LIKE '%webhook%'");
    console.log("Current Webhook Settings in DB:");
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("Error reading settings:", error);
  } finally {
    await pool.end();
  }
}

main();
