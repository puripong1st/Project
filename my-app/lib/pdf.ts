// lib/pdf.ts — PDF generator using pdfkit (RMUTP Purple & Education Pink Theme)
import PDFDocument from "pdfkit";
import { StudentRow } from "./db";
import fs from "fs";
import path from "path";

const STATUS_LABELS: Record<string, string> = {
  pending: "รอการอนุมัติ (Pending)",
  approved: "อนุมัติแล้ว (Approved)",
  rejected: "ปฏิเสธการเข้าถึง (Rejected)",
};

function formatThaiDateTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear() + 543; // Buddhist Era
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} น.`;
}

function formatThaiDateString(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0]) + 543;
  const month = parts[1];
  const day = parts[2];
  return `${day}/${month}/${year}`;
}

// Setup Thai fonts from local project directory or fallback to local system fonts
function setupFonts(doc: any) {
  try {
    const localFontPath = path.join(process.cwd(), "public", "fonts", "tahoma.ttf");
    const localFontBoldPath = path.join(process.cwd(), "public", "fonts", "tahomabd.ttf");

    if (fs.existsSync(localFontPath)) {
      doc.registerFont("ThaiFont", localFontPath);
      if (fs.existsSync(localFontBoldPath)) {
        doc.registerFont("ThaiFont-Bold", localFontBoldPath);
      } else {
        doc.registerFont("ThaiFont-Bold", localFontPath);
      }
      return { regular: "ThaiFont", bold: "ThaiFont-Bold", isCustom: true };
    }

    const sysFontPath = "C:\\Windows\\Fonts\\tahoma.ttf";
    const sysFontBoldPath = "C:\\Windows\\Fonts\\tahomabd.ttf";
    if (fs.existsSync(sysFontPath)) {
      doc.registerFont("ThaiFont", sysFontPath);
      if (fs.existsSync(sysFontBoldPath)) {
        doc.registerFont("ThaiFont-Bold", sysFontBoldPath);
      } else {
        doc.registerFont("ThaiFont-Bold", sysFontPath);
      }
      return { regular: "ThaiFont", bold: "ThaiFont-Bold", isCustom: true };
    }
  } catch (e) {
    console.warn("Failed to load Tahoma font, falling back to Helvetica:", e);
  }
  return { regular: "Helvetica", bold: "Helvetica-Bold", isCustom: false };
}

// Helper to filter out Thai characters if fallback font is active to prevent PDFKit crashes
function safeText(text: string, fonts: any): string {
  if (fonts.isCustom) return text || "-";
  if (!text) return "-";
  return text.replace(/[^\x00-\x7F]/g, "?");
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
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      lang: "th",
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fonts = setupFonts(doc);
    const pageWidth = doc.page.width; 
    const margin = 40;
    const contentWidth = pageWidth - margin * 2; 

    // ─── Header Banner (Purple Landscape) ───────────────────────
    doc
      .rect(0, 0, pageWidth, 110)
      .fill("#7C3AED"); 

    doc
      .rect(0, 110, pageWidth, 5)
      .fill("#DB2777");

    // Title Texts
    doc
      .font(fonts.bold)
      .fontSize(16)
      .fillColor("#FFFFFF")
      .text("RAJAMANGALA UNIVERSITY OF TECHNOLOGY PHRA NAKHON", margin, 20, {
        width: contentWidth,
        align: "center",
      });

    doc
      .font(fonts.regular)
      .fontSize(11)
      .fillColor("#F5F3FF")
      .text(safeText("มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร — คณะครุศาสตร์ (Education)", fonts), margin, 42, {
        width: contentWidth,
        align: "center",
      });

    doc
      .font(fonts.bold)
      .fontSize(14)
      .fillColor("#FFFFFF")
      .text(safeText("รายงานประวัติการเข้าใช้งานและจัดทำสิทธิ์ระบบควบคุมประตูอัตโนมัติ (Door Access Audit)", fonts), margin, 65, {
        width: contentWidth,
        align: "center",
      });

    // ─── Metadata block ─────────────────────────────────────────
    const metadataY = 135;
    doc.fillColor("#374151").font(fonts.regular).fontSize(9);

    // Metadata Left Column
    doc.text(safeText(`วันที่จัดทำรายงาน: ${formatThaiDateTime(new Date())}`, fonts), margin, metadataY);
    const filterLabels: Record<string, string> = {
      all: "รายชื่อทั้งหมดในฐานข้อมูล",
      pending: "เฉพาะผู้ที่อยู่ระหว่างรออนุมัติสิทธิ์",
      approved: "เฉพาะผู้ได้รับอนุมัติผ่านเข้าออกแล้ว",
      rejected: "เฉพาะผู้ที่ไม่ได้รับอนุญาต/ถูกปฏิเสธ",
    };
    doc.text(safeText(`ประเภทตัวกรอง: ${filterLabels[filter] || filter}`, fonts), margin, metadataY + 15);

    // Metadata Right Column
    doc.text(safeText(`ผู้จัดทำเอกสาร: ${exportedBy}`, fonts), margin + contentWidth / 2 + 80, metadataY);
    doc.text(safeText(`รวมรายการทั้งสิ้น: ${students.length} รายการ`, fonts), margin + contentWidth / 2 + 80, metadataY + 15);

    // Date Range Metadata Line (if present)
    if (startDate && endDate) {
      doc.text(safeText(`ช่วงเวลาสิทธิ์ในรายงาน: ตั้งแต่วันที่ ${formatThaiDateString(startDate)} ถึงวันที่ ${formatThaiDateString(endDate)}`, fonts), margin, metadataY + 30);
    } else if (startDate) {
      doc.text(safeText(`ช่วงเวลาสิทธิ์ในรายงาน: ตั้งแต่วันที่ ${formatThaiDateString(startDate)} เป็นต้นไป`, fonts), margin, metadataY + 30);
    } else if (endDate) {
      doc.text(safeText(`ช่วงเวลาสิทธิ์ในรายงาน: จนถึงวันที่ ${formatThaiDateString(endDate)}`, fonts), margin, metadataY + 30);
    }

    // Decorative Separator
    doc
      .moveTo(margin, metadataY + 42)
      .lineTo(margin + contentWidth, metadataY + 42)
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .stroke();

    // ─── Table Header ─────────────────────────────────────────
    const tableTop = metadataY + 52;
    
    // Sum of colWidths = 25 + 95 + 115 + 115 + 115 + 25 + 110 + 110 + 50 = 760 points
    const colWidths = [25, 95, 115, 115, 115, 25, 110, 110, 50];
    const cols = ["ลำดับ", "รหัสนักศึกษา", "ชื่อ - นามสกุล", "คณะวิชา", "สาขาวิชา", "ปี", "วันเวลาลงทะเบียน", "วันเวลาดำเนินการ", "สถานะ"];
    const colAligns: ("center" | "left")[] = ["center", "center", "left", "left", "left", "center", "center", "center", "center"];

    let xPos = margin;

    // Header background
    doc.rect(margin, tableTop, contentWidth, 24).fill("#4C1D95");

    doc.font(fonts.bold).fontSize(9).fillColor("#FFFFFF");
    cols.forEach((col, i) => {
      doc.text(safeText(col, fonts), xPos + 4, tableTop + 7, {
        width: colWidths[i] - 8,
        align: colAligns[i],
      });
      xPos += colWidths[i];
    });

    // ─── Table Rows ───────────────────────────────────────────
    let yPos = tableTop + 24;

    students.forEach((student, index) => {
      if (yPos > doc.page.height - 80) {
        doc.addPage();
        yPos = 50;

        // Draw header on new page
        xPos = margin;
        doc.rect(margin, yPos, contentWidth, 24).fill("#4C1D95");
        doc.font(fonts.bold).fontSize(9).fillColor("#FFFFFF");
        cols.forEach((col, i) => {
          doc.text(safeText(col, fonts), xPos + 4, yPos + 7, {
            width: colWidths[i] - 8,
            align: colAligns[i],
          });
          xPos += colWidths[i];
        });
        yPos += 24;
      }

      const rowHeight = 24;
      const bgColor = index % 2 === 0 ? "#F5F3FF" : "#FFFFFF";
      doc.rect(margin, yPos, contentWidth, rowHeight).fill(bgColor);

      const statusColor =
        student.status === "approved" ? "#10B981" :
        student.status === "rejected" ? "#EF4444" : "#F59E0B";
      
      doc.rect(margin, yPos, 4, rowHeight).fill(statusColor);

      const limitText = (str: string, len: number) => {
        if (!str) return "-";
        return str.length > len ? str.substring(0, len - 2) + "..." : str;
      };

      const rowData = [
        (index + 1).toString(),
        student.student_id,
        `${student.title}${student.first_name} ${student.last_name}`,
        limitText(student.faculty, 22),
        limitText(student.branch, 22),
        student.year.toString(),
        formatThaiDateTime(student.registered_at), 
        formatThaiDateTime(student.approved_at),  
        student.status === "approved" ? "อนุมัติ" : student.status === "rejected" ? "ปฏิเสธ" : "รออนุมัติ",
      ];

      xPos = margin;
      doc.font(fonts.regular).fontSize(7.5).fillColor("#1F2937");
      
      rowData.forEach((val, i) => {
        const isStatusCol = i === 8;
        const color = isStatusCol ? statusColor : "#1F2937";
        doc.font(isStatusCol ? fonts.bold : fonts.regular).fillColor(color);

        doc.text(safeText(val, fonts), xPos + 4, yPos + 8, {
          width: colWidths[i] - 8,
          align: colAligns[i],
          lineBreak: false,
        });
        xPos += colWidths[i];
      });

      yPos += rowHeight;
    });

    // Draw table bottom border
    doc.rect(margin, yPos, contentWidth, 1).fill("#DB2777");

    // ─── Page Footer ──────────────────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.rect(0, doc.page.height - 35, pageWidth, 35).fill("#F9FAFB");
      doc
        .font(fonts.regular)
        .fontSize(8)
        .fillColor("#6B7280")
        .text(
          safeText(`ระบบจัดการและจัดทำประวัติสิทธิ์ผ่านประตู คณะครุศาสตร์ มทร.พระนคร (RMUTP Door Access System) | หน้าที่ ${i + 1} จากทั้งหมด ${pages.count} หน้า`, fonts),
          margin,
          doc.page.height - 23,
          { width: contentWidth, align: "center" }
        );
    }

    doc.end();
  });
}

export async function generateSingleStudentPDF(
  student: StudentRow,
  exportedBy: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      lang: "th",
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fonts = setupFonts(doc);
    const pageWidth = doc.page.width;
    const margin = 45;
    const contentWidth = pageWidth - margin * 2;

    // ─── Header Gradient Banner ──────────────────────────────
    doc
      .rect(0, 0, pageWidth, 120)
      .fill("#7C3AED"); // Purple
    doc
      .rect(0, 120, pageWidth, 5)
      .fill("#DB2777"); // Pink Line

    // Title inside header
    doc
      .font(fonts.bold)
      .fontSize(16)
      .fillColor("#FFFFFF")
      .text("RAJAMANGALA UNIVERSITY OF TECHNOLOGY PHRA NAKHON", margin, 20, {
        width: contentWidth,
        align: "center",
      });

    doc
      .font(fonts.regular)
      .fontSize(11)
      .fillColor("#F5F3FF")
      .text(safeText("มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร — คณะครุศาสตร์", fonts), margin, 42, {
        width: contentWidth,
        align: "center",
      });

    doc
      .font(fonts.bold)
      .fontSize(15)
      .fillColor("#FFFFFF")
      .text(safeText("เอกสารประวัติข้อมูลผู้ขอเข้าใช้ห้องเรียน / ห้องปฏิบัติการ", fonts), margin, 65, {
        width: contentWidth,
        align: "center",
      });

    // ─── Card Content ──────────────────────────────────────────
    const cardTop = 150;

    const statusColor =
      student.status === "approved" ? "#10B981" :
      student.status === "rejected" ? "#EF4444" : "#F59E0B";

    const statusBg =
      student.status === "approved" ? "#ECFDF5" :
      student.status === "rejected" ? "#FEF2F2" : "#FFFBEB";

    const statusText = STATUS_LABELS[student.status] || student.status;

    // Background Card Box
    doc
      .roundedRect(margin, cardTop, contentWidth, 310, 12)
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .stroke();

    // Fill Header Area of Card
    doc
      .roundedRect(margin + 1, cardTop + 1, contentWidth - 2, 45, 10)
      .fill("#F9FAFB");

    doc
      .rect(margin + 1, cardTop + 35, contentWidth - 2, 12)
      .fill("#F9FAFB");

    doc
      .font(fonts.bold)
      .fontSize(12)
      .fillColor("#4C1D95")
      .text(safeText("รายละเอียดส่วนบุคคลและสถานะการลงทะเบียน", fonts), margin + 20, cardTop + 16);

    // Status badge rendering
    doc
      .roundedRect(margin + contentWidth - 170, cardTop + 12, 150, 22, 4)
      .fill(statusBg);
    doc
      .font(fonts.bold)
      .fontSize(8)
      .fillColor(statusColor)
      .text(safeText(statusText, fonts), margin + contentWidth - 170, cardTop + 19, { width: 150, align: "center" });

    // Grid details
    const labelX = margin + 20;
    const valX = labelX + 110;
    let detailY = cardTop + 65;
    const lineHeight = 20;

    const renderRow = (label: string, value: string, highlightColor?: string) => {
      doc.font(fonts.bold).fontSize(9).fillColor("#4B5563").text(safeText(label, fonts), labelX, detailY);
      doc.font(fonts.regular).fontSize(9.5).fillColor(highlightColor || "#1F2937").text(safeText(value, fonts), valX, detailY);
      detailY += lineHeight;
    };

    renderRow("รหัสประจำตัว:", student.student_id, "#7C3AED");
    renderRow("ชื่อ - นามสกุล:", `${student.title}${student.first_name} ${student.last_name}`);
    renderRow("ระดับชั้นปีที่:", `ชั้นปีที่ ${student.year}`);
    renderRow("คณะวิชาที่สังกัด:", student.faculty);
    renderRow("สาขาวิชา / ภาควิชา:", student.branch);
    renderRow("วันที่ยื่นลงทะเบียน:", formatThaiDateTime(student.registered_at));
    
    renderRow("สถานะคำขอ:", student.status === "approved" ? "ได้รับอนุมัติ (อนุมัติสิทธิ์เข้าห้อง)" : student.status === "rejected" ? "ถูกปฏิเสธสิทธิ์" : "อยู่ระหว่างรอพิจารณาอนุมัติ", statusColor);

    if (student.status === "approved") {
      renderRow("ผู้อนุมัติสิทธิ์:", student.approver_name || `Admin ID: ${student.approved_by || "ระบบ"}`);
      renderRow("วันที่อนุมัติ:", formatThaiDateTime(student.approved_at));
      renderRow("สิทธิ์การเปิดประตู:", "ได้รับสิทธิ์เปิดประตูห้องผ่านเครื่อง LAFVIN / ESP32");
    } else if (student.status === "rejected") {
      renderRow("ผู้ดำเนินการปฏิเสธ:", student.approver_name || `Admin ID: ${student.approved_by || "ระบบ"}`);
      renderRow("วันที่ดำเนินการ:", formatThaiDateTime(student.approved_at));
      renderRow("สาเหตุการปฏิเสธ:", student.rejection_reason || "ไม่ได้ระบุเหตุผล", "#EF4444");
    }

    renderRow("เครื่องที่สมัคร (IP):", student.ip_address || "ไม่ได้บันทึกไว้");

    // ─── Administrative Section ────────────────────────────────
    const adminY = 480;
    doc
      .roundedRect(margin, adminY, contentWidth, 120, 8)
      .strokeColor("#F3F4F6")
      .fill("#F9FAFB");

    doc
      .font(fonts.bold)
      .fontSize(9.5)
      .fillColor("#DB2777")
      .text(safeText("ข้อมูลและแนวปฏิบัติสิทธิ์ความปลอดภัย", fonts), margin + 15, adminY + 15);

    const guidelines = [
      "1. ผู้ใช้ต้องใช้ข้อมูลจริงในการขอรับสิทธิ์เข้าห้องปฏิบัติการ คณะครุศาสตร์",
      "2. เมื่อได้รับอนุมัติ สิทธิ์จะผูกกับรหัสนี้ และสามารถเรียกเปิดประตูด้วยอุปกรณ์ตามสิทธิ์",
      "3. ห้ามแบ่งปันบัญชีสิทธิ์หรือเปิดประตูให้บุคคลอื่นที่ไม่มีสิทธิ์เข้าใช้ตามลำพัง",
      "4. ข้อมูลการลงทะเบียนนี้ถูกบันทึกในฐานข้อมูล MySQL และจะเข้ารหัสเพื่อความปลอดภัยระดับสูงสุด"
    ];

    let guideY = adminY + 32;
    doc.font(fonts.regular).fontSize(7.5).fillColor("#4B5563");
    guidelines.forEach(line => {
      doc.text(safeText(line, fonts), margin + 15, guideY);
      guideY += 13;
    });

    // ─── Signatures ─────────────────────────────────────────────
    const sigY = 630;
    
    // Line for Approver Signature
    doc
      .moveTo(margin + 40, sigY + 50)
      .lineTo(margin + 180, sigY + 50)
      .strokeColor("#D1D5DB")
      .stroke();

    doc
      .font(fonts.regular)
      .fontSize(8.5)
      .fillColor("#4B5563")
      .text(safeText("ลงชื่อ ...........................................................", fonts), margin + 40, sigY + 45);
    
    doc
      .font(fonts.bold)
      .fontSize(8)
      .fillColor("#374151")
      .text(safeText("เจ้าหน้าที่ผู้มีสิทธิ์อนุมัติห้อง", fonts), margin + 40, sigY + 58, { width: 140, align: "center" });

    if (student.status === "approved" && student.approver_name) {
      doc
        .font(fonts.regular)
        .fontSize(8)
        .fillColor("#10B981")
        .text(safeText(`( ${student.approver_name} )`, fonts), margin + 40, sigY + 70, { width: 140, align: "center" });
    } else {
      doc
        .font(fonts.regular)
        .fontSize(7.5)
        .fillColor("#9CA3AF")
        .text(safeText("( ........................................................... )", fonts), margin + 40, sigY + 70, { width: 140, align: "center" });
    }

    // Line for Student Signature
    doc
      .moveTo(margin + contentWidth - 180, sigY + 50)
      .lineTo(margin + contentWidth - 40, sigY + 50)
      .strokeColor("#D1D5DB")
      .stroke();

    doc
      .font(fonts.regular)
      .fontSize(8.5)
      .fillColor("#4B5563")
      .text(safeText("ลงชื่อ ...........................................................", fonts), margin + contentWidth - 180, sigY + 45);

    doc
      .font(fonts.bold)
      .fontSize(8)
      .fillColor("#374151")
      .text(safeText("นักศึกษาผู้ขอสิทธิ์เข้าใช้ห้อง", fonts), margin + contentWidth - 180, sigY + 58, { width: 140, align: "center" });
    
    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor("#1F2937")
      .text(safeText(`( ${student.title}${student.first_name} ${student.last_name} )`, fonts), margin + contentWidth - 180, sigY + 70, { width: 140, align: "center" });

    // Stamp circle
    doc
      .circle(margin + contentWidth / 2, sigY + 40, 30)
      .strokeColor("rgba(219, 39, 119, 0.15)")
      .lineWidth(2)
      .stroke();
    
    doc
      .font(fonts.bold)
      .fontSize(6)
      .fillColor("#DB2777")
      .text(safeText("ครุศาสตร์ มทร.พ", fonts), margin + contentWidth / 2 - 20, sigY + 32, { width: 40, align: "center" })
      .text("OFFICIAL STAMP", margin + contentWidth / 2 - 25, sigY + 42, { width: 50, align: "center" });

    // ─── Footer ───────────────────────────────────────────────
    doc
      .rect(0, doc.page.height - 35, pageWidth, 35)
      .fill("#F3F4F6");

    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor("#6B7280")
      .text(
        safeText(`ประวัติข้อมูลจัดทำขึ้นอัตโนมัติโดยระบบจัดการ RMUTP Door Access System | เอกสารฉบับทางการ | ออกรายงานโดย: ${exportedBy}`, fonts),
        margin,
        doc.page.height - 23,
        { width: contentWidth, align: "center" }
      );

    doc.end();
  });
}
