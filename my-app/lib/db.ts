// lib/db.ts — PostgreSQL connection pool with auto table creation + seed
import { Pool, PoolConfig } from "pg";
import bcrypt from "bcryptjs";
import { parse } from "pg-connection-string";
import { DEFAULT_SYSTEM_SETTINGS, getFallbackSettings } from "./resilience";

// Use globalThis to persist the pg Pool instance across module hot-reloads in Next.js development mode
const globalForDb = globalThis as unknown as {
  pool?: Pool;
  settingsCache?: {
    value: Record<string, string>;
    expiresAt: number;
  };
};

// Settings cache: 30s so frequent ESP32 polls don't hammer DB unnecessarily
const SETTINGS_CACHE_TTL_MS = 30_000;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function readCaCert(): string | undefined {
  const ca = readEnv("SUPABASE_CA_CERT")?.replace(/\\n/g, "\n");
  if (!ca || ca.includes("YOUR_PEM_ENCODED_CA_CERTIFICATE_HERE")) {
    return undefined;
  }
  return ca;
}

export function getPool(): Pool {
  if (!globalForDb.pool) {
    const isProd = process.env.NODE_ENV === "production";

    if (!process.env.SUPABASE_CA_CERT && process.env.NODE_ENV === 'production') {
      console.error('[SECURITY] SUPABASE_CA_CERT not set — DB connections may fail');
    }

    if (process.env.NODE_ENV !== 'production' && !process.env.SUPABASE_CA_CERT) {
      console.warn('[DEV] No SUPABASE_CA_CERT — using default SSL');
    }

    const connectionString = readEnv("POSTGRES_URL") || readEnv("DATABASE_URL");

    if (!connectionString && process.env.NODE_ENV === 'production') {
      throw new Error(
        "Critical Security Error: POSTGRES_URL or DATABASE_URL is not configured in the production environment. " +
        "Database password exposure risks require environment variable configuration."
      );
    }

    const connectionConfig = connectionString ? parse(connectionString) : ({} as ReturnType<typeof parse>);

    const host = connectionConfig.host || readEnv("POSTGRES_HOST") || readEnv("DATABASE_HOST");
    const database = connectionConfig.database || readEnv("POSTGRES_DATABASE") || readEnv("DATABASE_DATABASE") || "postgres";
    const user = connectionConfig.user || readEnv("POSTGRES_USER") || readEnv("DATABASE_USER");
    const password = connectionConfig.password || readEnv("POSTGRES_PASSWORD") || readEnv("DATABASE_PASSWORD");
    const portValue = connectionConfig.port || readEnv("POSTGRES_PORT") || readEnv("DATABASE_PORT");

    if (!host || !user || !password) {
      throw new Error(
        "Database configuration error: PostgreSQL environment variables are missing. " +
        "Set POSTGRES_URL or DATABASE_URL, or set connection credentials (HOST, USER, PASSWORD) in Vercel Project Settings > Environment Variables."
      );
    }

    const caCert = readCaCert();
    const sslConfig = caCert ? {
      ca: caCert,
      rejectUnauthorized: true
    } : {
      rejectUnauthorized: false // Fallback to allow connection if CA cert is not provided
    };

    const config: PoolConfig = {
      host,
      port: portValue ? parseInt(portValue, 10) : undefined,
      database,
      user,
      password,
      ssl: sslConfig,
      // Keep the pool small for serverless deployments; each warm lambda has its own pool.
      max: parseInt(readEnv("POSTGRES_POOL_MAX") || "5", 10),
      min: 0,
      idleTimeoutMillis: 60000,        // Keep idle connections alive for 60s (reduce reconnect overhead)
      connectionTimeoutMillis: 3000,   // Raise slightly to avoid spurious timeouts on cold start
      keepAlive: true,                 // Enable TCP keepAlive — prevents Supabase from dropping idle connections
      keepAliveInitialDelayMillis: 10000, // Start keepAlive after 10s of inactivity
    };
    globalForDb.pool = new Pool(config);
    console.log("[DB] Established global singleton database connection pool");
  }
  return globalForDb.pool;
}

let dbInitialized = false;

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;
  
  // Fast Path Optimization: If database is already initialized, skip all 15 CREATE TABLE queries to prevent high latency!
  if (process.env.SKIP_DB_INIT === "true") {
    dbInitialized = true;
    console.log("[DB] Fast Path: Skipping schema table checks (Database already seeded & active)");
    return;
  }

  console.log(`[DB] Production mode: Connecting directly to PostgreSQL`);

  const initPool = getPool();
  try {
    console.log(`[DB] Connection established. Initializing tables...`);

    // 1. Create admin_users table
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'door_operator',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    await initPool.query(`
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check
    `);

    await initPool.query(`
      ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('owner', 'door_operator', 'log_viewer'))
    `);

    await initPool.query(`
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS allowed_rooms TEXT DEFAULT NULL
    `);

    // 2. Create students table
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        title VARCHAR(20) NOT NULL DEFAULT 'นาย',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        student_id VARCHAR(30) UNIQUE NOT NULL,
        year SMALLINT NOT NULL,
        faculty VARCHAR(150) NOT NULL,
        branch VARCHAR(150) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INT,
        approved_at TIMESTAMP,
        rejection_reason VARCHAR(500),
        ip_address VARCHAR(50),
        requested_room VARCHAR(50) NOT NULL DEFAULT 'default',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_door_open TIMESTAMP,
        bypass_token VARCHAR(64) DEFAULT NULL,
        FOREIGN KEY (approved_by) REFERENCES admin_users(id) ON DELETE SET NULL
      )
    `);

    // 3. Create access_logs table
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        student_id INT,
        action VARCHAR(50) NOT NULL,
        performed_by INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        esp32_response VARCHAR(500),
        notes TEXT,
        room_code VARCHAR(50) NOT NULL DEFAULT 'default',
        room VARCHAR(50),
        method VARCHAR(50),
        ip_address VARCHAR(50),
        details TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
        FOREIGN KEY (performed_by) REFERENCES admin_users(id) ON DELETE SET NULL
      )
    `);

    // Safely add columns if the table already exists from an older version
    await initPool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='room') THEN
              ALTER TABLE access_logs ADD COLUMN room VARCHAR(50);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='method') THEN
              ALTER TABLE access_logs ADD COLUMN method VARCHAR(50);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='ip_address') THEN
              ALTER TABLE access_logs ADD COLUMN ip_address VARCHAR(50);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_logs' AND column_name='details') THEN
              ALTER TABLE access_logs ADD COLUMN details TEXT;
          END IF;
      END
      $$;
    `);

    // 4. Create dynamic_qr_tokens table (security-hardened schema)
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS dynamic_qr_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(64) UNIQUE NOT NULL,
        room_code VARCHAR(50) NOT NULL DEFAULT 'default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_consumed BOOLEAN DEFAULT FALSE
      )
    `);

    // 5. Create system_settings table for configurable features
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Create rate_limits table for serverless-friendly rate limiting
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key VARCHAR(255) PRIMARY KEY,
        count INT NOT NULL DEFAULT 0,
        reset_time BIGINT NOT NULL
      )
    `);

    await initPool.query(`
      CREATE TABLE IF NOT EXISTS offline_submissions (
        offline_id VARCHAR(80) PRIMARY KEY,
        student_id VARCHAR(30) NOT NULL,
        requested_room VARCHAR(50) NOT NULL DEFAULT 'default',
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        client_created_at TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'accepted'
      )
    `);

    await initPool.query(`
      CREATE TABLE IF NOT EXISTS offline_grants (
        nonce_hash VARCHAR(64) PRIMARY KEY,
        room_code VARCHAR(50) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    // PDPA ม.19 — Consent audit trail (server-side proof of consent)
    // เก็บหลักฐานการให้/ถอน consent 3 ปี ตามแนวปฏิบัติ สคส.
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS consent_records (
        id BIGSERIAL PRIMARY KEY,
        consent_uuid VARCHAR(64) UNIQUE NOT NULL,
        ip_hash CHAR(64) NOT NULL,
        user_agent TEXT,
        version VARCHAR(10) NOT NULL,
        necessary BOOLEAN NOT NULL DEFAULT TRUE,
        functional BOOLEAN NOT NULL DEFAULT FALSE,
        analytics BOOLEAN NOT NULL DEFAULT FALSE,
        marketing BOOLEAN NOT NULL DEFAULT FALSE,
        action VARCHAR(20) NOT NULL CHECK (action IN ('granted', 'withdrawn', 'updated', 'declined')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cloud OTA Firmware Management Table
    await initPool.query(`
      CREATE TABLE IF NOT EXISTS firmware_releases (
        id SERIAL PRIMARY KEY,
        version VARCHAR(32) UNIQUE NOT NULL,
        file_path TEXT NOT NULL,
        file_size INT NOT NULL,
        checksum_md5 VARCHAR(32) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by UUID
      )
    `);

    await initPool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_consent_ip_time') THEN
              CREATE INDEX idx_consent_ip_time ON consent_records (ip_hash, created_at DESC);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_consent_uuid') THEN
              CREATE INDEX idx_consent_uuid ON consent_records (consent_uuid);
          END IF;
      END
      $$;
    `);

    // Create indexes if not exists using PL/pgSQL
    await initPool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_active_token') THEN
              CREATE INDEX idx_active_token ON dynamic_qr_tokens (is_consumed, room_code, created_at);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_status') THEN
              CREATE INDEX idx_room_status ON students (requested_room, status);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_timestamp') THEN
              CREATE INDEX idx_room_timestamp ON access_logs (room_code, timestamp);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_token_lookup') THEN
              CREATE INDEX idx_token_lookup ON dynamic_qr_tokens (token);
          END IF;
      END
      $$;
    `);

    // Seed default settings if not exists
    const defaultSettings = Object.entries(DEFAULT_SYSTEM_SETTINGS).map(([key, value]) => ({ key, value }));

    for (const setting of defaultSettings) {
      await initPool.query(
        "INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING",
        [setting.key, setting.value]
      );
    }

    // Seed default admin if not exists (securely check the total admin count)
    const { rows: adminCountRows } = await initPool.query(
      "SELECT COUNT(*) as count FROM admin_users"
    );
    const adminCount = parseInt(adminCountRows[0].count, 10);
    const isProd = process.env.NODE_ENV === "production";

    if (adminCount === 0) {
      // Guard: explicitly warn and block dev seed if ALLOW_DEV_SEED is misconfigured in production
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SEED === "true") {
        console.error("[SECURITY] ALLOW_DEV_SEED=true in production! Ignoring.");
        // ข้าม dev seed ใน production เสมอ
      }

      if (isProd) {
        // Production: secure initial admin provisioning via environment variables
        const initialUsername = process.env.INITIAL_ADMIN_USERNAME;
        const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;
        const initialFullName = process.env.INITIAL_ADMIN_FULL_NAME || "System Administrator (Owner)";

        if (!initialUsername || !initialPassword) {
          throw new Error(
            "Production Database Initialization Error: No admin users found in the 'admin_users' table. " +
            "To seed the initial production administrator, you MUST configure the environment variables: " +
            "INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD."
          );
        }

        // Enforce strong password policy for production admin
        if (initialPassword.length < 12) {
          throw new Error(
            "Production Database Initialization Error: INITIAL_ADMIN_PASSWORD must be at least 12 characters."
          );
        }
        if (!/[A-Z]/.test(initialPassword)) {
          throw new Error(
            "Production Database Initialization Error: INITIAL_ADMIN_PASSWORD must contain uppercase letter."
          );
        }
        if (!/[0-9]/.test(initialPassword)) {
          throw new Error(
            "Production Database Initialization Error: INITIAL_ADMIN_PASSWORD must contain a number."
          );
        }

        const hash = await bcrypt.hash(initialPassword, 12);
        await initPool.query(
          `INSERT INTO admin_users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)`,
          [initialUsername, hash, initialFullName, "owner"]
        );
        console.log(`[DB] Successfully seeded initial production administrator: '${initialUsername}' (Credentials validated securely, password hidden)`);
      } else {
        // Development: only seed the insecure default credentials if ALLOW_DEV_SEED is explicitly enabled
        if (process.env.ALLOW_DEV_SEED === "true") {
          const hash = await bcrypt.hash("admin123", 12);
          await initPool.query(
            `INSERT INTO admin_users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)`,
            ["admin", hash, "ผู้ดูแลระบบ (Owner)", "owner"]
          );
          console.log("[DB] Seeded default development admin user: admin / admin123 (ALLOW_DEV_SEED is true)");
        } else {
          console.log("[DB] Skipping default admin seeding in development. Set ALLOW_DEV_SEED=true to seed default dev credentials (admin/admin123).");
        }
      }
    }

    console.log("[DB] Database initialized successfully");

  } catch (error) {
    console.error("[DB] Error during database initialization:", error);
    throw error;
  }
}

// Type definitions for query results
export interface StudentRow {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  student_id: string;
  year: number;
  faculty: string;
  branch: string;
  status: "pending" | "approved" | "rejected";
  approved_by: number | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  ip_address: string | null;
  registered_at: Date;
  last_door_open: Date | null;
  bypass_token?: string | null;
  approver_name?: string;
  requested_room: string;
}

export interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: "owner" | "door_operator" | "log_viewer";
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
  allowed_rooms: string | null;
}

export interface AccessLogRow {
  id: number;
  student_id: number | null;
  action: string;
  performed_by: number | null;
  timestamp: Date;
  esp32_response: string | null;
  notes: string | null;
  room_code: string;
  student_name?: string;
  student_code?: string;
  admin_name?: string;
  requested_room?: string;
}

export function clearSystemSettingsCache(): void {
  globalForDb.settingsCache = undefined;
}

export async function getSystemSettings(options: { force?: boolean } = {}): Promise<Record<string, string>> {
  const now = Date.now();
  if (!options.force && globalForDb.settingsCache && globalForDb.settingsCache.expiresAt > now) {
    return globalForDb.settingsCache.value;
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query("SELECT setting_key, setting_value FROM system_settings");
    const settings: Record<string, string> = getFallbackSettings();
    for (const row of rows as { setting_key: string; setting_value: string }[]) {
      settings[row.setting_key] = row.setting_value;
    }
    globalForDb.settingsCache = {
      value: settings,
      expiresAt: now + SETTINGS_CACHE_TTL_MS,
    };
    return settings;
  } catch (error) {
    console.error("[DB] Falling back to default system settings:", error);
    return getFallbackSettings();
  }
}

export async function updateSystemSetting(key: string, value: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP",
    [key, value]
  );
  clearSystemSettingsCache();
}

export async function updateSystemSettings(settings: Record<string, string>): Promise<void> {
  const entries = Object.entries(settings);
  if (entries.length === 0) return;

  const keys = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const pool = getPool();
  await pool.query(
    `INSERT INTO system_settings (setting_key, setting_value)
     SELECT * FROM UNNEST($1::text[], $2::text[])
     ON CONFLICT (setting_key)
     DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
    [keys, values]
  );
  clearSystemSettingsCache();
}
