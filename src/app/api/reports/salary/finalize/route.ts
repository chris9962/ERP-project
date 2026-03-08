import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const { month, year, rows } = body as {
    month: number;
    year: number;
    rows: Array<{
      employee_id: string;
      employee_code: string;
      full_name: string;
      employment_type: string;
      salary_amount: number;
      total_days: number;
      bonus: number;
      total_salary: number;
      note: string;
    }>;
  };

  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  // Get employee details for snapshot
  const employeeIds = rows.map((r) => r.employee_id);
  const { data: employees } = await supabase
    .from("employees")
    .select("id, cccd_number, profiles(roles(name))")
    .in("id", employeeIds);

  const empMap = new Map(
    (employees ?? []).map((e) => [e.id, e]),
  );

  // Insert salary_records
  const records = rows.map((r) => {
    const emp = empMap.get(r.employee_id) as { id: string; cccd_number: string | null; profiles: { roles: { name: string } | null } | null } | undefined;
    return {
      employee_id: r.employee_id,
      month,
      year,
      full_name: r.full_name,
      employee_code: r.employee_code,
      cccd_number: emp?.cccd_number || null,
      role_name: (emp?.profiles as { roles: { name: string } | null } | null)?.roles?.name || null,
      employment_type: r.employment_type,
      salary_amount: r.salary_amount,
      total_days: r.total_days,
      bonus: r.bonus,
      total_salary: r.total_salary,
      note: r.note || null,
    };
  });

  // Delete old records if any (re-finalize case)
  await supabase
    .from("salary_records")
    .delete()
    .eq("month", month)
    .eq("year", year);

  const { error: insertErr } = await supabase
    .from("salary_records")
    .insert(records);

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Upsert salary_period
  const { error: periodErr } = await supabase
    .from("salary_periods")
    .upsert(
      {
        month,
        year,
        status: "finalized",
        finalized_by: user?.id ?? null,
        finalized_at: new Date().toISOString(),
      },
      { onConflict: "month,year" },
    );

  if (periodErr) return NextResponse.json({ error: periodErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { month, year } = body as { month: number; year: number };

  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  await supabase.from("salary_records").delete().eq("month", month).eq("year", year);
  await supabase.from("salary_periods").delete().eq("month", month).eq("year", year);

  return NextResponse.json({ ok: true });
}
