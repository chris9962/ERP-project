import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*, departments(name), profiles(full_name, email)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { full_name, employee_code, cccd_number, department_id, employment_type, status, salary_amount } = body;
  const { data, error } = await supabase
    .from("employees")
    .update({
      ...(full_name !== undefined && { full_name }),
      ...(employee_code !== undefined && { employee_code: employee_code || null }),
      ...(cccd_number !== undefined && { cccd_number: cccd_number || null }),
      ...(department_id !== undefined && { department_id: department_id || null }),
      ...(employment_type !== undefined && { employment_type }),
      ...(status !== undefined && { status }),
      ...(salary_amount !== undefined && { salary_amount: parseFloat(salary_amount) || 0 }),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
