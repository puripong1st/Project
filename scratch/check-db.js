// scratch/check-db.js
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres.wvuvdnutidctmyojacrn:0CXFSbjybuigR79a@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected to DB successfully.");
    const res = await client.query("SELECT * FROM system_settings");
    console.log("=== DB Settings ===");
    res.rows.forEach(row => {
      console.log(`${row.setting_key}: ${row.setting_value}`);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
