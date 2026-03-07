import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await params;
  const supabase = await createClient();
  const [empRes, salRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, employee_code")
      .eq("id", employeeId)
      .single(),
    supabase
      .from("salary_history")
      .select("*")
      .eq("employee_id", employeeId)
      .order("effective_date", { ascending: false }),
  ]);
  if (empRes.error) return NextResponse.json({ error: empRes.error.message }, { status: 500 });
  return NextResponse.json({
    employee: empRes.data,
    records: salRes.data ?? [],
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const body = await request.json();
  const { salary_amount, effective_date, reason, current_record_id, current_end_date } = body;

  if (current_record_id && current_end_date) {
    await supabase
      .from("salary_history")
      .update({ end_date: current_end_date })
      .eq("id", current_record_id);
  }

  const { data, error } = await supabase
    .from("salary_history")
    .insert({
      employee_id: employeeId,
      salary_amount: parseFloat(salary_amount),
      effective_date,
      reason: reason || null,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
