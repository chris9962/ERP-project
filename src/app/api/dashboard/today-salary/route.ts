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

  let totalSalary = 0;
  for (const att of attRes.data ?? []) {
    const emp = empMap.get(att.employee_id);
    if (!emp || !emp.salary_amount) continue;
    const value = Number(att.value);
    if (emp.employment_type === "part_time") {
      // Lương theo ngày * giá trị điểm danh
      totalSalary += emp.salary_amount * value;
    } else {
      // Full-time: lương tháng / số ngày trong tháng * giá trị điểm danh
      totalSalary += (emp.salary_amount / daysInMonth) * value;
    }
  }

  return NextResponse.json({ totalSalary: Math.round(totalSalary) });
}
