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
      .select("id, employee_code, full_name, avatar_url, cccd_number, department_id, departments(id, name), status, start_date, profiles(roles(name))")
      .eq("status", "active")
      .lte("start_date", date)
      .order("employee_code"),
    supabase.from("departments").select("id, name").order("name"),
    supabase
      .from("attendance")
      .select("employee_id, value, note")
      .eq("date", date),
  ]);

  if (empRes.error) return NextResponse.json({ error: empRes.error.message }, { status: 500 });
  type EmpFromDb = {
    id: string;
    employee_code: string | null;
    full_name: string | null;
    cccd_number: string | null;
    department_id: string | null;
    departments: { id: string; name: string }[] | null;
    status: string;
  };
  type Employee = Omit<EmpFromDb, "departments"> & {
    departments: { id: string; name: string } | null;
  };
  const raw = (empRes.data ?? []) as EmpFromDb[];
  const employees: Employee[] = raw.map((emp) => ({
    ...emp,
    departments: Array.isArray(emp.departments) ? emp.departments[0] ?? null : emp.departments,
  }));
  const existing = attRes.data ?? [];

  // Chuẩn hóa value sang number (Supabase có thể trả về string)
  const toNum = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const validValues = [0, 0.5, 1, 1.5];
  const entries = employees.map((emp) => {
    const record = existing.find((a: { employee_id: string }) => a.employee_id === emp.id);
    const raw = record != null ? toNum(record.value) : null;
    const value = raw != null && validValues.includes(raw) ? raw : null;
    return {
      employeeId: emp.id,
      value,
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

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
  const toUpsert = (entries ?? []).map((e) => ({
    employee_id: e.employeeId,
    date,
    value: e.value,
    note: e.note || null,
    noted_by: user?.id ?? null,
  }));

  await supabase.from("attendance").delete().eq("date", date);
  const { error } =
    toUpsert.length > 0
      ? await supabase.from("attendance").insert(toUpsert)
      : { error: null };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
