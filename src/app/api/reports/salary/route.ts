import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") ?? "");
  const year = parseInt(searchParams.get("year") ?? "");

  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  const supabase = await createClient();

  // Check if this period is finalized
  const { data: period } = await supabase
    .from("salary_periods")
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .single();

  const finalized = period?.status === "finalized";

  if (finalized) {
    // Query from salary_records
    const { data: records } = await supabase
      .from("salary_records")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    const rows = (records ?? []).map((r) => ({
      employee_id: r.employee_id,
      employee_code: r.employee_code || "",
      full_name: r.full_name || "",
      employment_type: r.employment_type || "full_time",
      salary_amount: Number(r.salary_amount) || 0,
      total_days: Number(r.total_days) || 0,
      bonus: Number(r.bonus) || 0,
      total_salary: Number(r.total_salary) || 0,
      note: r.note || "",
    }));

    return NextResponse.json({ finalized: true, rows });
  }

  // Real-time query
  const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, full_name, department, employment_type, salary_amount")
    .eq("status", "active")
    .lte("start_date", toDate);

  if (!employees?.length) return NextResponse.json({ finalized: false, rows: [] });

  const rows: Array<{
    employee_id: string;
    employee_code: string;
    full_name: string;
    employment_type: string;
    salary_amount: number;
    total_days: number;
    bonus: number;
    total_salary: number;
    note: string;
  }> = [];

  for (const emp of employees) {
    const { data: attendance } = await supabase
      .from("attendance")
      .select("value")
      .eq("employee_id", emp.id)
      .gte("date", fromDate)
      .lte("date", toDate);

    const totalDays = attendance?.reduce((sum: number, a: { value: number }) => sum + a.value, 0) || 0;
    const salaryAmount = Number(emp.salary_amount) || 0;
    const isPartTime = emp.employment_type === "part_time";
    const totalSalary = isPartTime
      ? salaryAmount * totalDays
      : salaryAmount;

    rows.push({
      employee_id: emp.id,
      employee_code: emp.employee_code || "",
      full_name: emp.full_name || "",
      employment_type: emp.employment_type || "full_time",
      salary_amount: salaryAmount,
      total_days: totalDays,
      bonus: 0,
      total_salary: totalSalary,
      note: "",
    });
  }

  return NextResponse.json({ finalized: false, rows });
}
