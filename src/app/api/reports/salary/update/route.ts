import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { employee_id, month, year, bonus, note } = body as {
    employee_id: string;
    month: number;
    year: number;
    bonus: number;
    note: string;
  };

  if (!employee_id || !month || !year)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  // Update the salary_record, recalculate total_salary
  const { data: record } = await supabase
    .from("salary_records")
    .select("salary_amount, total_days, employment_type")
    .eq("employee_id", employee_id)
    .eq("month", month)
    .eq("year", year)
    .single();
  console.log(record);
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  const baseSalary = Number(record.salary_amount) || 0;
  const totalDays = Number(record.total_days) || 0;
  const isPartTime = record.employment_type === "part_time";
  const computedSalary = isPartTime ? baseSalary * totalDays : baseSalary;
  const totalSalary = computedSalary;

  const { error } = await supabase
    .from("salary_records")
    .update({ bonus: bonus || 0, note: note || null, total_salary: totalSalary })
    .eq("employee_id", employee_id)
    .eq("month", month)
    .eq("year", year);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
