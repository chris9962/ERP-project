import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  totalEmployees: number;
  workingCount: number;
  todaySalary: number;
  counts: {
    fullDay: number;
    halfDay: number;
    overtime: number;
    absent: number;
    notMarked: number;
  };
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const [empRes, attRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id, employment_type, salary_amount")
      .eq("status", "active"),
    supabase
      .from("attendance")
      .select("employee_id, value")
      .eq("date", today),
  ]);

  const employees = empRes.data ?? [];
  const attendance = attRes.data ?? [];
  const attMap = new Map(attendance.map((a) => [a.employee_id, Number(a.value)]));

  // Count attendance
  const values = attendance.map((a) => Number(a.value));
  const counts = {
    fullDay: values.filter((v) => v === 1).length,
    halfDay: values.filter((v) => v === 0.5).length,
    overtime: values.filter((v) => v === 1.5).length,
    absent: values.filter((v) => v === 0).length,
    notMarked: employees.length - attendance.length,
  };

  // Working count = those who have attendance and value > 0
  const workingCount = values.filter((v) => v > 0).length;

  // Today salary (same logic as today-salary API)
  let todaySalary = 0;
  for (const emp of employees) {
    if (!emp.salary_amount) continue;
    const dailyRate = emp.salary_amount / daysInMonth;
    const attValue = attMap.get(emp.id);

    if (emp.employment_type === "full_time") {
      if (attValue === undefined || attValue !== 0) {
        todaySalary += dailyRate;
      }
    } else {
      if (attValue !== undefined) {
        todaySalary += emp.salary_amount * attValue;
      }
    }
  }

  return {
    totalEmployees: employees.length,
    workingCount,
    todaySalary: Math.round(todaySalary),
    counts,
  };
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN");
}

export function buildDailyReport(stats: DashboardStats): string {
  const today = new Date().toISOString().split("T")[0];
  const { totalEmployees, workingCount, todaySalary, counts } = stats;

  const lines: string[] = [
    `📊 <b>BÁO CÁO NGÀY ${today}</b>`,
    ``,
    `👥 Đang làm: <b>${workingCount}</b> / ${totalEmployees} nhân viên`,
  ];

  const details: string[] = [];
  if (counts.fullDay > 0) details.push(`${counts.fullDay} đủ ngày`);
  if (counts.halfDay > 0) details.push(`${counts.halfDay} nửa ngày`);
  if (counts.overtime > 0) details.push(`${counts.overtime} tăng ca`);
  if (counts.absent > 0) details.push(`${counts.absent} vắng`);
  if (counts.notMarked > 0) details.push(`${counts.notMarked} chưa điểm danh`);

  if (details.length > 0) {
    lines.push(`  (${details.join(", ")})`);
  }

  lines.push(``);
  lines.push(`💰 Chi phí lương: <b>${formatCurrency(todaySalary)} VND</b>`);

  return lines.join("\n");
}
