// scratch_inspect_settings.js
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
