import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { StudentRow } from "./db";

const COLORS = {
  ink: "#111827",
  muted: "#6B7280",
  line: "#E5E7EB",
  soft: "#F8FAFC",
  purple: "#6D28D9",
  purpleSoft: "#F5F3FF",
  pink: "#DB2777",
  green: "#059669",
  greenSoft: "#ECFDF5",
  amber: "#D97706",
  amberSoft: "#FFFBEB",
  red: "#DC2626",
  redSoft: "#FEF2F2",
};

const STATUS_META: Record<StudentRow["status"], { label: string; color: string; bg: string }> = {
  pending: { label: "รออนุมัติ", color: COLORS.amber, bg: COLORS.amberSoft },
  approved: { label: "อนุมัติแล้ว", color: COLORS.green, bg: COLORS.greenSoft },
  rejected: { label: "ปฏิเสธ", color: COLORS.red, bg: COLORS.redSoft },
};

interface FontSetup {
  regular: string;
  bold: string;
  isCustom: boolean;
}

function setupFonts(doc: PDFKit.PDFDocument): FontSetup {
  try {
    const localFontPath = path.join(process.cwd(), "public", "fonts", "tahoma.ttf");
    const localFontBoldPath = path.join(process.cwd(), "public", "fonts", "tahomabd.ttf");
    const sysFontPath = "C:\\Windows\\Fonts\\tahoma.ttf";
    const sysFontBoldPath = "C:\\Windows\\Fonts\\tahomabd.ttf";

    const regularPath = fs.existsSync(localFontPath) ? localFontPath : sysFontPath;
    const boldPath = fs.existsSync(localFontBoldPath) ? localFontBoldPath : sysFontBoldPath;

    if (fs.existsSync(regularPath)) {
      doc.registerFont("ThaiFont", regularPath);
      doc.registerFont("ThaiFont-Bold", fs.existsSync(boldPath) ? boldPath : regularPath);
      return { regular: "ThaiFont", bold: "ThaiFont-Bold", isCustom: true };
    }
  } catch (error) {
    console.warn("Failed to load Thai PDF font:", error);
  }

  return { regular: "Helvetica", bold: "Helvetica-Bold", isCustom: false };
}

function safeText(value: string | number | null | undefined, fonts: FontSetup): string {
  const text = value === null || value === undefined || value === "" ? "-" : String(value);
  return fonts.isCustom ? text : text.replace(/[^\x00-\x7F]/g, "?");
}

function formatThaiDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear() + 543;
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes} น.`;
}

function formatThaiDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${Number(year) + 543}`;
}

function roomLabel(room?: string | null): string {
  return room && room !== "default" ? room : "default";
}

function studentName(student: StudentRow): string {
  return `${student.title || ""}${student.first_name} ${student.last_name}`.trim();
}

function truncate(text: string | null | undefined, length: number): string {
  if (!text) return "-";
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function addFooter(doc: PDFKit.PDFDocument, fonts: FontSetup, margin: number): void {
  const range = doc.bufferedPageRange();
  const width = doc.page.width;

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.rect(0, doc.page.height - 34, width, 34).fill("#F9FAFB");
    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        safeText(`RMUTP Door Access System | หน้า ${i + 1} จาก ${range.count}`, fonts),
        margin,
        doc.page.height - 22,
        { width: width - margin * 2, align: "center", lineBreak: false }
      );
    doc.page.margins.bottom = originalBottomMargin;
  }
}

function header(doc: PDFKit.PDFDocument, fonts: FontSetup, title: string, subtitle: string, margin: number): void {
  const width = doc.page.width;
  const contentWidth = width - margin * 2;

  doc.rect(0, 0, width, 84).fill(COLORS.ink);
  doc.rect(0, 84, width, 4).fill(COLORS.pink);
  doc
    .font(fonts.bold)
    .fontSize(15)
    .fillColor("#FFFFFF")
    .text("RAJAMANGALA UNIVERSITY OF TECHNOLOGY PHRA NAKHON", margin, 18, {
      width: contentWidth,
      align: "center",
    });
  doc
    .font(fonts.regular)
    .fontSize(10)
    .fillColor("#E5E7EB")
    .text(safeText("คณะครุศาสตร์อุตสาหกรรม - ระบบควบคุมประตูอัตโนมัติ", fonts), margin, 39, {
      width: contentWidth,
      align: "center",
    });
  doc
    .font(fonts.bold)
    .fontSize(13)
    .fillColor("#FFFFFF")
    .text(safeText(title, fonts), margin, 58, { width: contentWidth, align: "center" });
  doc
    .font(fonts.regular)
    .fontSize(8)
    .fillColor("#CBD5E1")
    .text(safeText(subtitle, fonts), margin, 96, { width: contentWidth, align: "center" });
}

function infoBox(doc: PDFKit.PDFDocument, fonts: FontSetup, x: number, y: number, w: number, label: string, value: string): void {
  doc.roundedRect(x, y, w, 40, 6).fill(COLORS.soft).strokeColor(COLORS.line).stroke();
  doc.font(fonts.regular).fontSize(7.5).fillColor(COLORS.muted).text(safeText(label, fonts), x + 10, y + 8);
  doc.font(fonts.bold).fontSize(10).fillColor(COLORS.ink).text(safeText(value, fonts), x + 10, y + 21, { width: w - 20 });
}

export async function generateStudentsPDF(
  students: StudentRow[],
  exportedBy: string,
  filter: string = "all",
  startDate?: string,
  endDate?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 36, bottom: 46, left: 34, right: 34 },
      lang: "th",
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fonts = setupFonts(doc);
    const margin = 34;
    const width = doc.page.width;
    const contentWidth = width - margin * 2;
    const filterLabel = filter === "all" ? "ทุกสถานะ" : STATUS_META[filter as StudentRow["status"]]?.label || filter;
    const dateRange = startDate || endDate ? `${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}` : "ทั้งหมด";

    header(doc, fonts, "รายงานทะเบียนผู้ขอใช้สิทธิ์ผ่านประตู", "Door Access Audit Report", margin);

    const metaTop = 122;
    const boxWidth = (contentWidth - 30) / 4;
    infoBox(doc, fonts, margin, metaTop, boxWidth, "ผู้จัดทำ", exportedBy);
    infoBox(doc, fonts, margin + boxWidth + 10, metaTop, boxWidth, "วันที่ออกรายงาน", formatThaiDateTime(new Date()));
    infoBox(doc, fonts, margin + (boxWidth + 10) * 2, metaTop, boxWidth, "ตัวกรอง", filterLabel);
    infoBox(doc, fonts, margin + (boxWidth + 10) * 3, metaTop, boxWidth, "ช่วงวันที่", dateRange);

    const summaryTop = metaTop + 56;
    const summary = [
      { label: "รวม", value: students.length, color: COLORS.purple },
      { label: "อนุมัติ", value: students.filter(s => s.status === "approved").length, color: COLORS.green },
      { label: "รออนุมัติ", value: students.filter(s => s.status === "pending").length, color: COLORS.amber },
      { label: "ปฏิเสธ", value: students.filter(s => s.status === "rejected").length, color: COLORS.red },
    ];

    summary.forEach((item, index) => {
      const x = margin + index * 92;
      doc.roundedRect(x, summaryTop, 80, 30, 6).fill("#FFFFFF").strokeColor(COLORS.line).stroke();
      doc.font(fonts.bold).fontSize(12).fillColor(item.color).text(String(item.value), x + 9, summaryTop + 5);
      doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted).text(safeText(item.label, fonts), x + 9, summaryTop + 18);
    });

    const tableTop = summaryTop + 48;
    const colWidths = [28, 86, 122, 118, 112, 34, 62, 96, 96, 62];
    const cols = ["#", "รหัสนักศึกษา", "ชื่อ - นามสกุล", "คณะ", "สาขา", "ปี", "ห้อง", "ลงทะเบียน", "ดำเนินการ", "สถานะ"];
    const aligns: ("left" | "center")[] = ["center", "center", "left", "left", "left", "center", "center", "center", "center", "center"];

    const drawTableHeader = (y: number) => {
      let x = margin;
      doc.rect(margin, y, contentWidth, 24).fill(COLORS.ink);
      doc.font(fonts.bold).fontSize(8).fillColor("#FFFFFF");
      cols.forEach((col, i) => {
        doc.text(safeText(col, fonts), x + 4, y + 7, { width: colWidths[i] - 8, align: aligns[i] });
        x += colWidths[i];
      });
    };

    drawTableHeader(tableTop);
    let y = tableTop + 24;

    if (students.length === 0) {
      doc.roundedRect(margin, y + 18, contentWidth, 52, 6).fill(COLORS.soft).strokeColor(COLORS.line).stroke();
      doc
        .font(fonts.bold)
        .fontSize(12)
        .fillColor(COLORS.muted)
        .text(safeText("ไม่พบข้อมูลตามตัวกรองที่เลือก", fonts), margin, y + 37, { width: contentWidth, align: "center" });
    }

    students.forEach((student, index) => {
      if (y > doc.page.height - 76) {
        doc.addPage();
        y = 42;
        drawTableHeader(y);
        y += 24;
      }

      const status = STATUS_META[student.status];
      const rowHeight = 24;
      doc.rect(margin, y, contentWidth, rowHeight).fill(index % 2 === 0 ? "#FFFFFF" : COLORS.soft);
      doc.rect(margin, y, 3, rowHeight).fill(status.color);

      const row = [
        String(index + 1),
        student.student_id,
        studentName(student),
        truncate(student.faculty, 20),
        truncate(student.branch, 20),
        String(student.year),
        roomLabel(student.requested_room),
        formatThaiDateTime(student.registered_at),
        formatThaiDateTime(student.approved_at),
        status.label,
      ];

      let x = margin;
      row.forEach((value, i) => {
        const isStatus = i === row.length - 1;
        doc
          .font(isStatus ? fonts.bold : fonts.regular)
          .fontSize(7.3)
          .fillColor(isStatus ? status.color : COLORS.ink)
          .text(safeText(value, fonts), x + 4, y + 8, {
            width: colWidths[i] - 8,
            align: aligns[i],
            lineBreak: false,
          });
        x += colWidths[i];
      });

      doc.moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      y += rowHeight;
    });

    addFooter(doc, fonts, margin);
    doc.end();
  });
}

export async function generateSingleStudentPDF(student: StudentRow, exportedBy: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 46, left: 42, right: 42 },
      lang: "th",
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fonts = setupFonts(doc);
    const margin = 42;
    const contentWidth = doc.page.width - margin * 2;
    const status = STATUS_META[student.status];

    header(doc, fonts, "เอกสารประวัติผู้ขอใช้สิทธิ์ผ่านประตู", "Individual Door Access Record", margin);

    const cardTop = 130;
    doc.roundedRect(margin, cardTop, contentWidth, 88, 8).fill("#FFFFFF").strokeColor(COLORS.line).stroke();
    doc.circle(margin + 38, cardTop + 44, 22).fill(COLORS.purpleSoft);
    doc.font(fonts.bold).fontSize(16).fillColor(COLORS.purple).text("ID", margin + 28, cardTop + 34);
    doc.font(fonts.bold).fontSize(17).fillColor(COLORS.ink).text(safeText(studentName(student), fonts), margin + 74, cardTop + 24, { width: contentWidth - 210 });
    doc.font(fonts.regular).fontSize(10).fillColor(COLORS.muted).text(safeText(student.student_id, fonts), margin + 74, cardTop + 50);
    doc.roundedRect(margin + contentWidth - 130, cardTop + 30, 104, 28, 6).fill(status.bg).strokeColor(status.color).stroke();
    doc.font(fonts.bold).fontSize(10).fillColor(status.color).text(safeText(status.label, fonts), margin + contentWidth - 130, cardTop + 39, { width: 104, align: "center" });

    const detailsTop = cardTop + 112;
    const rows: Array<[string, string]> = [
      ["รหัสนักศึกษา", student.student_id],
      ["ชั้นปี", `ปี ${student.year}`],
      ["คณะ", student.faculty],
      ["สาขา", student.branch],
      ["ห้องที่ขอใช้สิทธิ์", roomLabel(student.requested_room)],
      ["วันที่ลงทะเบียน", formatThaiDateTime(student.registered_at)],
      ["วันที่ดำเนินการ", formatThaiDateTime(student.approved_at)],
      ["ผู้ดำเนินการ", student.approver_name || (student.approved_by ? `Admin ID: ${student.approved_by}` : "-")],
      ["IP ผู้สมัคร", student.ip_address || "-"],
    ];

    if (student.status === "rejected") {
      rows.push(["เหตุผลการปฏิเสธ", student.rejection_reason || "-"]);
    }

    doc.font(fonts.bold).fontSize(13).fillColor(COLORS.ink).text(safeText("รายละเอียดคำขอ", fonts), margin, detailsTop);
    let y = detailsTop + 24;
    rows.forEach(([label, value], index) => {
      const rowHeight = label === "เหตุผลการปฏิเสธ" ? 44 : 30;
      doc.rect(margin, y, contentWidth, rowHeight).fill(index % 2 === 0 ? COLORS.soft : "#FFFFFF");
      doc.font(fonts.bold).fontSize(9).fillColor(COLORS.muted).text(safeText(label, fonts), margin + 12, y + 9, { width: 130 });
      doc.font(fonts.regular).fontSize(9.5).fillColor(COLORS.ink).text(safeText(value, fonts), margin + 152, y + 9, { width: contentWidth - 170 });
      doc.moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      y += rowHeight;
    });

    const noteTop = y + 24;
    doc.roundedRect(margin, noteTop, contentWidth, 78, 8).fill(COLORS.purpleSoft).strokeColor("#DDD6FE").stroke();
    doc.font(fonts.bold).fontSize(11).fillColor(COLORS.purple).text(safeText("หมายเหตุการใช้งาน", fonts), margin + 16, noteTop + 14);
    doc
      .font(fonts.regular)
      .fontSize(9)
      .fillColor(COLORS.ink)
      .text(
        safeText("เอกสารนี้สร้างจากระบบ RMUTP Door Access System เพื่อใช้ตรวจสอบประวัติการขอสิทธิ์เข้าห้องและการดำเนินการของผู้ดูแลระบบ", fonts),
        margin + 16,
        noteTop + 34,
        { width: contentWidth - 32, lineGap: 3 }
      );

    const signTop = noteTop + 118;
    const signWidth = 180;
    [
      { x: margin + 34, label: "ผู้อนุมัติ / เจ้าหน้าที่", name: student.status === "approved" ? student.approver_name || "" : "" },
      { x: margin + contentWidth - signWidth - 34, label: "ผู้ขอใช้สิทธิ์", name: studentName(student) },
    ].forEach(item => {
      doc.moveTo(item.x, signTop + 38).lineTo(item.x + signWidth, signTop + 38).strokeColor(COLORS.line).stroke();
      doc.font(fonts.bold).fontSize(8.5).fillColor(COLORS.ink).text(safeText(item.label, fonts), item.x, signTop + 46, { width: signWidth, align: "center" });
      doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted).text(safeText(item.name || "(................................)", fonts), item.x, signTop + 60, { width: signWidth, align: "center" });
    });

    doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted).text(safeText(`ออกเอกสารโดย: ${exportedBy}`, fonts), margin, doc.page.height - 68, { width: contentWidth, align: "right" });

    addFooter(doc, fonts, margin);
    doc.end();
  });
}
