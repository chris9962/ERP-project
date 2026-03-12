import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Lấy attendance hôm nay + thông tin lương nhân viên
  const [attRes, empRes] = await Promise.all([
    supabase.from("attendance").select("employee_id, value").eq("date", today),
    supabase
      .from("employees")
      .select("id, employment_type, salary_amount")
      .eq("status", "active"),
  ]);

  if (attRes.error) return NextResponse.json({ error: attRes.error.message }, { status: 500 });
  if (empRes.error) return NextResponse.json({ error: empRes.error.message }, { status: 500 });

  const empMap = new Map(
    (empRes.data ?? []).map((e) => [e.id, e]),
  );

  // Build set of employees who have attendance today
  const attendedSet = new Set((attRes.data ?? []).map((a) => a.employee_id));

  let totalSalary = 0;
  for (const emp of empRes.data ?? []) {
    if (!emp.salary_amount) continue;
    const dailyRate = emp.salary_amount / daysInMonth;

    if (emp.employment_type === "full_time") {
      // Full-time: if no attendance record OR value > 0 → worked today → earns daily rate
      // If value === 0 → absent
      const att = (attRes.data ?? []).find((a) => a.employee_id === emp.id);
      if (!att || Number(att.value) !== 0) {
        totalSalary += dailyRate;
      }
      // If absent (value=0), no salary added (will be handled by monthly calculation with paid off / leave)
    } else {
      // Part-time: salary per day * value
      const att = (attRes.data ?? []).find((a) => a.employee_id === emp.id);
      if (att) {
        totalSalary += emp.salary_amount * Number(att.value);
      }
    }
  }

  return NextResponse.json({ totalSalary: Math.round(totalSalary) });
}
