import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const departmentId = searchParams.get("departmentId");

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, full_name, department_id, departments(name)")
    .eq("status", "active");

  if (!employees?.length) return NextResponse.json([]);

  const result: Array<{
    employee_id: string;
    employee_code: string;
    full_name: string;
    department_name: string;
    salary_amount: number;
    total_days: number;
    total_salary: number;
  }> = [];

  for (const emp of employees) {
    if (departmentId && departmentId !== "all" && emp.department_id !== departmentId) continue;

    const { data: salary } = await supabase
      .from("salary_history")
      .select("salary_amount")
      .eq("employee_id", emp.id)
      .lte("effective_date", toDate ?? "")
      .or(`end_date.is.null,end_date.gte.${fromDate ?? ""}`)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();

    const { data: attendance } = await supabase
      .from("attendance")
      .select("value")
      .eq("employee_id", emp.id)
      .gte("date", fromDate ?? "")
      .lte("date", toDate ?? "");

    const totalDays = attendance?.reduce((sum: number, a: { value: number }) => sum + a.value, 0) || 0;
    const salaryAmount = (salary as { salary_amount: number } | null)?.salary_amount || 0;
    const totalSalary = (salaryAmount / 26) * totalDays;

    result.push({
      employee_id: emp.id,
      employee_code: emp.employee_code || "",
      full_name: emp.full_name || "",
      department_name: (emp.departments as unknown as { name: string } | null)?.name || "",
      salary_amount: salaryAmount,
      total_days: totalDays,
      total_salary: totalSalary,
    });
  }

  return NextResponse.json(result);
}
