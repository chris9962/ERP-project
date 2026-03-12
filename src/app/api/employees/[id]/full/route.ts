import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();
  const [empRes, attRes, rolesRes, leaveRes] = await Promise.all([
    supabase
      .from("employees")
      .select("*, profiles(full_name, email, role_id, roles(name, label))")
      .eq("id", id)
      .single(),
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", id)
      .order("date", { ascending: false })
      .limit(30),
    supabase.from("roles").select("id, name, label").order("name"),
    supabase
      .from("employee_leave_balances")
      .select("remaining_days")
      .eq("employee_id", id)
      .eq("year", currentYear)
      .maybeSingle(),
  ]);
  if (empRes.error)
    return NextResponse.json({ error: empRes.error.message }, { status: 500 });
  return NextResponse.json({
    employee: empRes.data,
    attendance: attRes.data ?? [],
    roles: rolesRes.data ?? [],
    leaveBalance: leaveRes.data ? Number(leaveRes.data.remaining_days) : null,
  });
}
