// lib/db.ts — MySQL connection pool with auto table creation + seed
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const isSSL = process.env.MYSQL_SSL === 'true' || (process.env.MYSQL_HOST && process.env.MYSQL_HOST.endsWith('.aivencloud.com'));
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "admin",
      database: process.env.MYSQL_DATABASE || "rmutp_access",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "+07:00",
      ...(isSSL ? { ssl: {} } : {}),
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  // First connect without database to create it if not exists
  const initPool = mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "admin",
    waitForConnections: true,
    connectionLimit: 2,
  });

  const conn = await initPool.getConnection();
  try {
    const dbName = process.env.MYSQL_DATABASE || "rmutp_access";
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${dbName}\``);

    // Create admin_users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('owner', 'door_operator') NOT NULL DEFAULT 'door_operator',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT NOW(),
        last_login DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create students table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(20) NOT NULL DEFAULT 'นาย',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        year TINYINT NOT NULL,
        faculty VARCHAR(150) NOT NULL,
        branch VARCHAR(150) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by INT,
        approved_at DATETIME,
        rejection_reason VARCHAR(500),
        ip_address VARCHAR(50),
        requested_room VARCHAR(50) NOT NULL DEFAULT 'default',
        registered_at DATETIME DEFAULT NOW(),
        last_door_open DATETIME,
        FOREIGN KEY (approved_by) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create access_logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT,
        action ENUM('registered', 'approved', 'rejected', 'door_opened', 'door_failed') NOT NULL,
        performed_by INT,
        timestamp DATETIME DEFAULT NOW(),
        esp32_response VARCHAR(500),
        notes TEXT,
        room_code VARCHAR(50) NOT NULL DEFAULT 'default',
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
        FOREIGN KEY (performed_by) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create dynamic_qr_tokens table (security-hardened schema)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS dynamic_qr_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        token VARCHAR(64) UNIQUE NOT NULL,
        room_code VARCHAR(50) NOT NULL DEFAULT 'default',
        created_at DATETIME DEFAULT NOW(),
        is_consumed BOOLEAN DEFAULT FALSE,
        INDEX idx_active_token (is_consumed, room_code, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create system_settings table for configurable features
    await conn.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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
      const [existing] = await conn.query(
        "SELECT setting_key FROM system_settings WHERE setting_key = ?",
        [setting.key]
      );
      if ((existing as mysql.RowDataPacket[]).length === 0) {
        await conn.query(
          "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)",
          [setting.key, setting.value]
        );
      }
    }


    // Seed default admin if not exists
    const [existingAdmins] = await conn.query(
      "SELECT id FROM admin_users WHERE username = ?",
      ["admin"]
    );
    if ((existingAdmins as mysql.RowDataPacket[]).length === 0) {
      const hash = await bcrypt.hash("admin123", 12);
      await conn.query(
        `INSERT INTO admin_users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
        ["admin", hash, "ผู้ดูแลระบบ (Owner)", "owner"]
      );
      console.log("[DB] Seeded default admin user: admin / admin123");
    }

    // ─── Migration: เพิ่ม column title ถ้ายังไม่มี ─────────
    try {
      await conn.query(
        `ALTER TABLE students ADD COLUMN title VARCHAR(20) NOT NULL DEFAULT 'นาย' AFTER id`
      );
      console.log("[DB] Migration: added title column to students");
    } catch (e: unknown) {
      // Ignore if column already exists (error code 1060)
      if (!(e instanceof Error) || !e.message.includes("Duplicate column name")) {
        // column already exists — ok
      }
    }

    // ─── Migration: เพิ่ม column bypass_token ถ้ายังไม่มี ─────────
    try {
      await conn.query(
        `ALTER TABLE students ADD COLUMN bypass_token VARCHAR(64) DEFAULT NULL`
      );
      console.log("[DB] Migration: added bypass_token column to students");
    } catch {
      // Ignore if column already exists
    }

    // ─── Migration: ขยาย student_id ให้รับ format XXXXXXXXXXXX-X ─
    try {
      await conn.query(
        `ALTER TABLE students MODIFY COLUMN student_id VARCHAR(30) UNIQUE NOT NULL`
      );
    } catch { /* already correct length */ }

    // ─── Migration: เพิ่ม column room_code ใน dynamic_qr_tokens ถ้ายังไม่มี ─────────
    try {
      await conn.query(
        `ALTER TABLE dynamic_qr_tokens ADD COLUMN room_code VARCHAR(50) NOT NULL DEFAULT 'default'`
      );
      console.log("[DB] Migration: added room_code column to dynamic_qr_tokens");
    } catch { /* already exists */ }
    
    // ─── Migration: เพิ่ม column requested_room ใน students ถ้ายังไม่มี ─────────
    try {
      await conn.query(
        `ALTER TABLE students ADD COLUMN requested_room VARCHAR(50) NOT NULL DEFAULT 'default'`
      );
      console.log("[DB] Migration: added requested_room column to students");
    } catch { /* already exists */ }

    // ─── Migration: เพิ่ม column room_code ใน access_logs ถ้ายังไม่มี ─────────
    try {
      await conn.query(
        `ALTER TABLE access_logs ADD COLUMN room_code VARCHAR(50) NOT NULL DEFAULT 'default'`
      );
      console.log("[DB] Migration: added room_code column to access_logs");
    } catch { /* already exists */ }

    console.log("[DB] Database initialized successfully");

  } finally {
    conn.release();
    await initPool.end();
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
  const [rows] = await pool.query("SELECT setting_key, setting_value FROM system_settings");
  const settings: Record<string, string> = {};
  for (const row of rows as { setting_key: string; setting_value: string }[]) {
    settings[row.setting_key] = row.setting_value;
  }
  return settings;
}

export async function updateSystemSetting(key: string, value: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
    [key, value, value]
  );
}

