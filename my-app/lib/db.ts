// lib/db.ts — PostgreSQL connection pool with auto table creation + seed
import { Pool, PoolConfig } from "pg";
import bcrypt from "bcryptjs";

// Force Node.js to accept self-signed SSL certificates from Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config: PoolConfig = {
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    };
    pool = new Pool(config);
  }
  return pool;
}

let dbInitialized = false;

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;
  
  // Fast Path Optimization: If database is already initialized, skip all 15 CREATE TABLE queries to prevent high latency!
  if (process.env.SKIP_DB_INIT === "true" || process.env.NODE_ENV === "production") {
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
        role VARCHAR(20) NOT NULL DEFAULT 'door_operator' CHECK (role IN ('owner', 'door_operator')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
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
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
        FOREIGN KEY (performed_by) REFERENCES admin_users(id) ON DELETE SET NULL
      )
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
    const defaultSettings = [
      { key: "auto_approve_enabled", value: "1" },
      { key: "auto_approve_start_time", value: "09:00" },
      { key: "auto_approve_end_time", value: "16:00" },
      { key: "auto_approve_days", value: "1,2,3,4,5" },
      { key: "discord_webhook_register", value: "" },
      { key: "discord_webhook_approve", value: "" },
      { key: "discord_webhook_logs", value: "" },
      { key: "auto_fill_enabled", value: "1" },
      { key: "auto_fill_mode", value: "auto" },
      { key: "configured_rooms", value: "CE-401,CE-402" },
      { key: "room_ip_CE-401", value: "192.168.1.100" },
      { key: "room_ip_CE-402", value: "192.168.1.101" },
      { key: "room_webhook_register_CE-401", value: "https://discord.com/api/webhooks/1507982864132870266/4x9kmjb2a6MyNN1PU-DTXuTDP-yKRXS-2CrB4MH6kgm0YCw3gkQpzNIajWlYT6Oe5mb0" },
      { key: "room_webhook_approve_CE-401", value: "https://discord.com/api/webhooks/1507982955207987313/ir0bWNmwvS4sAMtRBrZ8RzKQQN2y69HiFi9HHKYucnvUpJ4c4ZCIkhgWvLu63j6Vs-_4" },
      { key: "room_webhook_logs_CE-401", value: "https://discord.com/api/webhooks/1507983021817725062/sXAZeB6hmEAR-awMiU484AFKO9IKOPZFkXWgfPiHUefpnCkUuNZDwHXrF7-tsAIILWCr" },
    ];

    for (const setting of defaultSettings) {
      await initPool.query(
        "INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING",
        [setting.key, setting.value]
      );
    }

    // Seed default admin if not exists
    const { rows: existingAdmins } = await initPool.query(
      "SELECT id FROM admin_users WHERE username = $1",
      ["admin"]
    );
    if (existingAdmins.length === 0) {
      const hash = await bcrypt.hash("admin123", 12);
      await initPool.query(
        `INSERT INTO admin_users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)`,
        ["admin", hash, "ผู้ดูแลระบบ (Owner)", "owner"]
      );
      console.log("[DB] Seeded default admin user: admin / admin123");
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
  role: "owner" | "door_operator";
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
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

export async function getSystemSettings(): Promise<Record<string, string>> {
  const pool = getPool();
  const { rows } = await pool.query("SELECT setting_key, setting_value FROM system_settings");
  const settings: Record<string, string> = {};
  for (const row of rows as { setting_key: string; setting_value: string }[]) {
    settings[row.setting_key] = row.setting_value;
  }
  return settings;
}

export async function updateSystemSetting(key: string, value: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP",
    [key, value]
  );
}