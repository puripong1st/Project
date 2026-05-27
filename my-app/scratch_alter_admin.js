// scratch_alter_admin.js
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { parse } = require("pg-connection-string");

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

async function alter() {
  const connectionConfig = parse(connectionString);
  connectionConfig.ssl = { rejectUnauthorized: false };
  const pool = new Pool(connectionConfig);

  try {
    console.log("Dropping admin_users_role_check constraint...");
    await pool.query(`ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check`);
    
    console.log("Adding admin_users_role_check constraint supporting 'log_viewer'...");
    await pool.query(`ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('owner', 'door_operator', 'log_viewer'))`);

    console.log("Adding allowed_rooms column to admin_users...");
    await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS allowed_rooms TEXT DEFAULT NULL`);

    console.log("Success! Columns altered.");
  } catch (error) {
    console.error("Alter failed:", error);
  } finally {
    await pool.end();
  }
}

alter();
