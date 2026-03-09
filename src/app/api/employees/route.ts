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
    dob,
    address,
    gender,
    employee_code,
    department_id,
    employment_type,
    start_date,
    status,
    salary_amount,
    avatar_url,
  } = body;

  // Auto-generate employee_code: NV000001, NV000002, ...
  let code = employee_code;
  if (!code) {
    const { data: latest } = await supabase
      .from("employees")
      .select("employee_code")
      .like("employee_code", "NV%")
      .order("employee_code", { ascending: false })
      .limit(1)
      .single();
    const lastNum = latest?.employee_code ? parseInt(latest.employee_code.replace("NV", "")) || 0 : 0;
    code = `NV${String(lastNum + 1).padStart(6, "0")}`;
  }

  const { data: employee, error: empError } = await supabase
    .from("employees")
    .insert({
      profile_id,
      full_name: full_name ?? "",
      cccd_number: cccd_number || null,
      dob: dob || null,
      address: address || null,
      gender: gender || null,
      employee_code: code,
      department_id: department_id || null,
      employment_type: employment_type ?? "full_time",
      start_date: start_date || null,
      status: status ?? "active",
      salary_amount: salary_amount ? parseFloat(salary_amount) : 0,
      avatar_url: avatar_url || null,
    })
    .select()
    .single();

  if (empError)
    return NextResponse.json({ error: empError.message }, { status: 500 });

  return NextResponse.json(employee);
}
