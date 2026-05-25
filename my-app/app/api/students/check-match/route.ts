import { NextRequest, NextResponse } from "next/server";
import { getPool, getSystemSettings } from "@/lib/db";

// POST /api/students/check-match — ค้นหาประวัติเพื่อดึงข้อมูล คณะ สาขา ชั้นปี มาทำ Auto-fill
export async function POST(req: NextRequest) {
  try {
    const settings = await getSystemSettings();
    const autoFillEnabled = settings.auto_fill_enabled === "1";

    if (!autoFillEnabled) {
      return NextResponse.json({ found: false, disabled: true });
    }

    const body = await req.json();
    const { first_name, last_name, student_id } = body;

    // ชำระล้างข้อมูลและลบช่องว่างส่วนเกิน
    const sanitizedFirstName = String(first_name ?? "").trim();
    const sanitizedLastName = String(last_name ?? "").trim();
    const sanitizedStudentId = String(student_id ?? "").trim();

    if (!sanitizedFirstName || !sanitizedLastName || !sanitizedStudentId) {
      return NextResponse.json({ found: false, message: "กรอกข้อมูลไม่ครบถ้วน" });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT year, faculty, branch FROM students 
       WHERE first_name = $1 AND last_name = $2 AND student_id = $3
       ORDER BY registered_at DESC LIMIT 1`,
      [sanitizedFirstName, sanitizedLastName, sanitizedStudentId]
    );

    const matches = rows as { year: number; faculty: string; branch: string }[];

    if (matches.length > 0) {
      const match = matches[0];
      return NextResponse.json({
        found: true,
        year: match.year,
        faculty: match.faculty,
        branch: match.branch,
        mode: settings.auto_fill_mode || "auto",
      });
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error("[Check Student Match] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
