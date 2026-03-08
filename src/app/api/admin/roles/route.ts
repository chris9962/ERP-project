import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");

  const supabase = await createClient();
  let query = supabase.from("roles").select("*").order("name");

  if (group === "admin") {
    query = query.in("name", ["manager", "owner", "admin"]);
  } else if (group === "employee") {
    query = query.in("name", ["worker", "office_staff"]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
