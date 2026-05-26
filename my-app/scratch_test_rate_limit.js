// scratch_test_rate_limit.js
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

async function rateLimitDbSimulate(pool, key, limit, windowMs) {
  const now = Date.now();
  const defaultResetTime = now + windowMs;

  const query = `
    INSERT INTO rate_limits (key, count, reset_time)
    VALUES ($1, 1, $2)
    ON CONFLICT (key)
    DO UPDATE SET
      count = CASE WHEN $3 < rate_limits.reset_time THEN rate_limits.count + 1 ELSE 1 END,
      reset_time = CASE WHEN $3 < rate_limits.reset_time THEN rate_limits.reset_time ELSE $4 END
    RETURNING count, reset_time;
  `;

  const { rows } = await pool.query(query, [key, defaultResetTime, now, defaultResetTime]);
  const current = rows[0];

  return {
    success: current.count <= limit,
    count: current.count,
    resetTime: Number(current.reset_time),
  };
}

async function runTest() {
  if (!connectionString) {
    console.error("Error: POSTGRES_URL environment variable is not defined.");
    process.exit(1);
  }

  const connectionConfig = parse(connectionString);
  connectionConfig.ssl = { rejectUnauthorized: false };
  const pool = new Pool(connectionConfig);

  try {
    console.log("=== Rate Limit Test Suite ===");

    // Ensure table exists (runs the migration logic)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key VARCHAR(255) PRIMARY KEY,
        count INT NOT NULL DEFAULT 0,
        reset_time BIGINT NOT NULL
      )
    `);
    console.log("Verified rate_limits table schema is active in Supabase.");

    // Clean up test keys
    const testKey = `test_rate_limit_${Date.now()}`;
    console.log(`Using unique test key: ${testKey}`);

    // Test 1: Single request under limit
    console.log("\n[Test 1] First attempt under limit...");
    const res1 = await rateLimitDbSimulate(pool, testKey, 3, 10000);
    console.log("Result 1:", res1);
    if (res1.success && res1.count === 1) {
      console.log("-> TEST 1 PASSED!");
    } else {
      console.error("-> TEST 1 FAILED!");
    }

    // Test 2: Rapid sequential requests up to limit and exceeding
    console.log("\n[Test 2] Sequential attempts...");
    const res2 = await rateLimitDbSimulate(pool, testKey, 3, 10000);
    console.log("Result 2:", res2);
    const res3 = await rateLimitDbSimulate(pool, testKey, 3, 10000);
    console.log("Result 3 (Exactly at limit of 3):", res3);
    const res4 = await rateLimitDbSimulate(pool, testKey, 3, 10000);
    console.log("Result 4 (Exceeding limit):", res4);

    if (res2.success && res2.count === 2 && res3.success && res3.count === 3 && !res4.success && res4.count === 4) {
      console.log("-> TEST 2 PASSED (Correctly blocked at 4th request)!");
    } else {
      console.error("-> TEST 2 FAILED!");
    }

    // Test 3: Concurrency test (Atomic execution verification)
    console.log("\n[Test 3] Concurrency test (multiple updates concurrently)...");
    const concurrentKey = `test_concurrent_${Date.now()}`;
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(rateLimitDbSimulate(pool, concurrentKey, 5, 20000));
    }
    const results = await Promise.all(promises);
    console.log("Concurrent Results (Counts returned):", results.map(r => r.count));
    const uniqueCounts = new Set(results.map(r => r.count));

    if (uniqueCounts.size === 5 && Math.max(...results.map(r => r.count)) === 5) {
      console.log("-> TEST 3 PASSED! No race conditions, each call registered atomically!");
    } else {
      console.error("-> TEST 3 FAILED!");
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await pool.end();
    console.log("\n=== Test Suite Finished ===");
  }
}

runTest();
