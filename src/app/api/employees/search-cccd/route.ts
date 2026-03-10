import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cccd = request.nextUrl.searchParams.get("cccd");
  if (!cccd?.trim()) {
    return NextResponse.json({ error: "Missing cccd parameter" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*, profiles(full_name, email, roles(name))")
    .eq("cccd_number", cccd.trim())
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch today's attendance if employee found
  let todayAttendance = null;
  if (data) {
    const today = new Date().toISOString().split("T")[0];
    const { data: att } = await supabase
      .from("attendance")
      .select("value, note")
      .eq("employee_id", data.id)
      .eq("date", today)
      .maybeSingle();
    todayAttendance = att;
  }

  return NextResponse.json({ employee: data, todayAttendance });
}
