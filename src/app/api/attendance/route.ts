import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [empRes, deptRes, attRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id, employee_code, full_name, department_id, departments(id, name), status")
      .eq("status", "active")
      .order("employee_code"),
    supabase.from("departments").select("id, name").order("name"),
    supabase
      .from("attendance")
      .select("employee_id, value, note")
      .eq("date", date),
  ]);

  if (empRes.error) return NextResponse.json({ error: empRes.error.message }, { status: 500 });
  const employees = (empRes.data ?? []) as Array<{
    id: string;
    employee_code: string | null;
    full_name: string | null;
    department_id: string | null;
    departments: { id: string; name: string } | null;
    status: string;
  }>;
  const existing = attRes.data ?? [];

  const entries = employees.map((emp) => {
    const record = existing.find((a: { employee_id: string }) => a.employee_id === emp.id);
    return {
      employeeId: emp.id,
      value: record ? record.value : 1,
      note: record?.note || "",
      existing: !!record,
    };
  });

  return NextResponse.json({
    employees,
    departments: deptRes.data ?? [],
    entries: Object.fromEntries(entries.map((e) => [e.employeeId, e])),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const body = await request.json();
  const { date, entries } = body as { date: string; entries: Array<{ employeeId: string; value: number; note: string | null }> };

  if (!date || !entries?.length)
    return NextResponse.json({ error: "date and entries required" }, { status: 400 });

  const toUpsert = entries.map((e) => ({
    employee_id: e.employeeId,
    date,
    value: e.value,
    note: e.note || null,
    noted_by: user?.id ?? null,
  }));

  await supabase.from("attendance").delete().eq("date", date);
  const { error } = await supabase.from("attendance").insert(toUpsert);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
