// scratch_inspect_settings.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Pool } = require("pg");

const connectionString = "postgres://postgres.wvuvdnutidctmyojacrn:0CXFSbjybuigR79a@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function inspect() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Fetching configured_rooms from system_settings...");
    const { rows } = await pool.query(
      "SELECT * FROM system_settings WHERE setting_key = 'configured_rooms'"
    );
    console.log("Configured Rooms setting in DB:", rows);

    console.log("Fetching all system_settings keys...");
    const { rows: allSettings } = await pool.query(
      "SELECT setting_key, setting_value FROM system_settings"
    );
    console.log("All settings in DB:");
    console.table(allSettings);
  } catch (error) {
    console.error("Failed to inspect settings:", error);
  } finally {
    await pool.end();
  }
}

inspect();
