import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const [empRes, deptRes, attRes] = await Promise.all([
    supabase
      .from("employees")
      .select("*, departments(name), profiles(full_name, email, role_id, roles(name))")
      .eq("id", id)
      .single(),
    supabase.from("departments").select("id, name").order("name"),
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", id)
      .order("date", { ascending: false })
      .limit(30),
  ]);
  if (empRes.error)
    return NextResponse.json({ error: empRes.error.message }, { status: 500 });
  return NextResponse.json({
    employee: empRes.data,
    departments: deptRes.data ?? [],
    attendance: attRes.data ?? [],
  });
}
