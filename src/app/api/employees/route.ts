import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*, departments(name), profiles(full_name, email, roles(name))")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const {
    profile_id,
    full_name,
    cccd_number,
    employee_code,
    department_id,
    employment_type,
    start_date,
    status,
    salary_amount,
    salary_reason,
  } = body;

  const { data: employee, error: empError } = await supabase
    .from("employees")
    .insert({
      profile_id,
      full_name: full_name ?? "",
      cccd_number: cccd_number || null,
      employee_code: employee_code || null,
      department_id: department_id || null,
      employment_type: employment_type ?? "full_time",
      start_date: start_date || null,
      status: status ?? "active",
    })
    .select()
    .single();

  if (empError)
    return NextResponse.json({ error: empError.message }, { status: 500 });

  if (salary_amount && employee) {
    await supabase.from("salary_history").insert({
      employee_id: employee.id,
      salary_amount: parseFloat(salary_amount),
      effective_date: start_date || new Date().toISOString().split("T")[0],
      reason: salary_reason || "Luong khoi diem",
      created_by: null,
    });
  }

  return NextResponse.json(employee);
}
