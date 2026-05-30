"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DashboardChartsProps = {
  analyticsData: any;
  exportSummary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
};

export default function DashboardCharts({ analyticsData, exportSummary }: DashboardChartsProps) {
  // 1. Process Bar Chart Data (last 7 days of daily trend)
  const dailyTrend = analyticsData?.daily_trend || [];
  const barChartData = dailyTrend
    .slice(-7)
    .map((item: any) => {
      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      });
      return {
        name: formattedDate,
        "คำขอใหม่ (Requests)": Number(item.registrations || 0),
        "อนุมัติแล้ว (Approved)": Number(item.approvals || 0),
      };
    });

  // 2. Process Line Chart Data (Approved vs Rejected Daily Trend over last 10 days)
  const lineChartData = dailyTrend
    .slice(-10)
    .map((item: any) => {
      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      });
      return {
        name: formattedDate,
        "อนุมัติ (Approved)": Number(item.approvals || 0),
        "ปฏิเสธ (Rejected)": Number(item.rejections || 0),
      };
    });

  // 3. Process Donut Chart Data
  const pieData = [
    { name: "อนุมัติแล้ว (Approved)", value: exportSummary.approved, color: "#10B981" },
    { name: "รออนุมัติ (Pending)", value: exportSummary.pending, color: "#F59E0B" },
    { name: "ปฏิเสธสิทธิ์ (Rejected)", value: exportSummary.rejected, color: "#EF4444" },
  ].filter(item => item.value > 0); // Hide zero categories

  // Fallback if no pie data
  const finalPieData = pieData.length > 0 ? pieData : [
    { name: "ไม่มีข้อมูล", value: 1, color: "var(--border-medium)" }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }} className="animate-fade-in">
      
      {/* 1. Bar Chart Card */}
      <div className="premium-card" style={{ padding: 20, background: "var(--bg-secondary)" }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          📊 จำนวนการขอเข้าห้องเรียนรายวัน (7 วันล่าสุด)
        </h4>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow-md)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontFamily: "inherit"
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Bar dataKey="คำขอใหม่ (Requests)" fill="var(--smartaccess-purple)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="อนุมัติแล้ว (Approved)" fill="var(--edu-pink)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Line Chart Card */}
      <div className="premium-card" style={{ padding: 20, background: "var(--bg-secondary)" }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          📈 แนวโน้มการอนุมัติ vs ปฏิเสธ (Approved vs Rejected)
        </h4>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow-md)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontFamily: "inherit"
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Line type="monotone" dataKey="อนุมัติ (Approved)" stroke="#10B981" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="ปฏิเสธ (Rejected)" stroke="#EF4444" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Donut Chart Card */}
      <div className="premium-card" style={{ padding: 20, background: "var(--bg-secondary)" }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          🍩 สัดส่วนสถานะนักศึกษาทั้งหมดในระบบ (Status Proportion)
        </h4>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 260 }}>
          <div style={{ width: "60%", height: "100%", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {finalPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    boxShadow: "var(--shadow-md)",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "inherit"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none"
            }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", display: "block" }}>
                {exportSummary.total}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase" }}>
                คนทั้งหมด
              </span>
            </div>
          </div>
          {/* Custom Legends on the side */}
          <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: 10, paddingLeft: 10 }}>
            {finalPieData.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "4px", backgroundColor: item.color }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{item.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: item.color }}>{item.value} คน</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
