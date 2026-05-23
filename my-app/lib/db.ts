// lib/db.ts — MySQL connection pool with auto table creation + seed
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
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
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
        FOREIGN KEY (performed_by) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

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
  student_name?: string;
  student_code?: string;
  admin_name?: string;
}
