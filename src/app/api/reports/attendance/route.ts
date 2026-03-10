import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const department = searchParams.get("department");

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, full_name, department")
    .eq("status", "active");

  if (!employees?.length) return NextResponse.json([]);

  const result: Array<{
    employee_id: string;
    employee_code: string;
    full_name: string;
    department_name: string;
    total_days: number;
    absent_days: number;
    half_days: number;
    full_days: number;
    overtime_days: number;
  }> = [];

  for (const emp of employees) {
    if (department && department !== "all" && emp.department !== department) continue;

    const { data: attendance } = await supabase
      .from("attendance")
      .select("value")
      .eq("employee_id", emp.id)
      .gte("date", fromDate ?? "")
      .lte("date", toDate ?? "");

    const records = attendance ?? [];
    const totalDays = records.reduce((sum: number, a: { value: number }) => sum + a.value, 0);
    result.push({
      employee_id: emp.id,
      employee_code: emp.employee_code || "",
      full_name: emp.full_name || "",
      department_name: emp.department || "",
      total_days: totalDays,
      absent_days: records.filter((a: { value: number }) => a.value === 0).length,
      half_days: records.filter((a: { value: number }) => a.value === 0.5).length,
      full_days: records.filter((a: { value: number }) => a.value === 1).length,
      overtime_days: records.filter((a: { value: number }) => a.value === 1.5).length,
    });
  }

  return NextResponse.json(result);
}
