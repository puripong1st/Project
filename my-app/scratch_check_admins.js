// scratch_check_admins.js
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

async function check() {
  const connectionConfig = parse(connectionString);
  connectionConfig.ssl = { rejectUnauthorized: false };
  const pool = new Pool(connectionConfig);

  try {
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_users'
    `);
    console.log("admin_users Columns:");
    console.table(columns);

    const { rows: admins } = await pool.query(`
      SELECT id, username, role, allowed_rooms FROM admin_users
    `);
    console.log("admin_users data:");
    console.table(admins);
  } catch (error) {
    console.error("Check failed:", error);
  } finally {
    await pool.end();
  }
}

check();
