import { describe, it, expect } from "vitest";
import {
  canOperateRoom,
  validateUsername,
  validatePasswordPolicy,
  signToken,
  verifyToken,
  type AdminPayload,
} from "../lib/auth";

const owner: AdminPayload = {
  id: 1,
  username: "owner",
  full_name: "Owner",
  role: "owner",
  allowed_rooms: null,
};

const operatorCE401: AdminPayload = {
  id: 2,
  username: "op401",
  full_name: "Operator 401",
  role: "door_operator",
  allowed_rooms: "CE-401",
};

describe("canOperateRoom", () => {
  it("owner เปิดได้ทุกห้องเสมอ", () => {
    expect(canOperateRoom(owner, "CE-401")).toBe(true);
    expect(canOperateRoom(owner, "CE-999")).toBe(true);
  });

  it("door_operator เปิดได้เฉพาะห้องที่ได้รับมอบหมาย (กัน V04)", () => {
    expect(canOperateRoom(operatorCE401, "CE-401")).toBe(true);
    expect(canOperateRoom(operatorCE401, "CE-402")).toBe(false);
  });

  it("door_operator ที่ไม่มี allowed_rooms เปิดไม่ได้เลย", () => {
    const noRooms: AdminPayload = { ...operatorCE401, allowed_rooms: null };
    expect(canOperateRoom(noRooms, "CE-401")).toBe(false);
  });

  it("รองรับ wildcard '*' และหลายห้องคั่นด้วยเครื่องหมายจุลภาค", () => {
    const star: AdminPayload = { ...operatorCE401, allowed_rooms: "*" };
    const multi: AdminPayload = { ...operatorCE401, allowed_rooms: "CE-401, CE-402" };
    expect(canOperateRoom(star, "any-room")).toBe(true);
    expect(canOperateRoom(multi, "CE-402")).toBe(true);
    expect(canOperateRoom(multi, "CE-403")).toBe(false);
  });
});

describe("validateUsername", () => {
  it("ยอมรับ username ที่ถูกต้องตาม regex ^[a-zA-Z0-9_.]{3,30}$", () => {
    expect(validateUsername("admin_01").ok).toBe(true);
    expect(validateUsername("a.b.c").ok).toBe(true);
  });

  it("ปฏิเสธ username สั้นเกินไป ยาวเกินไป หรือมีอักขระต้องห้าม (กัน SQLi payload)", () => {
    expect(validateUsername("ab").ok).toBe(false);
    expect(validateUsername("a".repeat(31)).ok).toBe(false);
    expect(validateUsername("admin'; DROP TABLE--").ok).toBe(false);
    expect(validateUsername("ชื่อไทย").ok).toBe(false);
  });
});

describe("validatePasswordPolicy", () => {
  it("ยอมรับรหัสผ่านความยาวอย่างน้อย 6 ตัว", () => {
    expect(validatePasswordPolicy("123456").ok).toBe(true);
  });

  it("ปฏิเสธรหัสผ่านสั้นกว่า 6 ตัว", () => {
    expect(validatePasswordPolicy("12345").ok).toBe(false);
  });
});

describe("JWT sign/verify", () => {
  it("token ที่ลงนามถูกต้องต้อง verify ผ่านและคืน payload เดิม", () => {
    const token = signToken(operatorCE401);
    const decoded = verifyToken(token);
    expect(decoded?.id).toBe(operatorCE401.id);
    expect(decoded?.role).toBe("door_operator");
    expect(decoded?.allowed_rooms).toBe("CE-401");
  });

  it("token ที่ถูกแก้ลายเซ็น (forge) ต้องถูกปฏิเสธ", () => {
    const token = signToken(owner);
    const tampered = token.slice(0, -3) + "aaa";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("token ขยะ/ว่างต้องคืน null ไม่ throw", () => {
    expect(verifyToken("not.a.jwt")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });
});
