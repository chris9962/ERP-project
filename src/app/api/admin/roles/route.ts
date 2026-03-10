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

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { name, label, description } = body as { name: string; label: string | null; description: string | null };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Tên role không được để trống" }, { status: 400 });
  }

  if (!/^[a-z][a-z0-9_]*$/.test(name.trim())) {
    return NextResponse.json({ error: "Tên role chỉ được chứa chữ thường, số và dấu _, bắt đầu bằng chữ" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("roles")
    .insert({
      name: name.trim(),
      label: label?.trim() || null,
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { id, name, label, description } = body as { id: string; name: string; label: string | null; description: string | null };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!name?.trim()) return NextResponse.json({ error: "Tên role không được để trống" }, { status: 400 });

  const { data, error } = await supabase
    .from("roles")
    .update({
      name: name.trim(),
      label: label?.trim() || null,
      description: description?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Check if any profiles are using this role
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Không thể xóa: đang có ${count} user sử dụng role này` },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
