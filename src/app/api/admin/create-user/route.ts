import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify caller is admin (use regular client with user session)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = (profile?.roles as unknown as { name: string } | null)?.name;
  if (roleName !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, phone, role_id, role_name } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email và mật khẩu là bắt buộc" },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[create-user] createAdminClient failed:", e);
    return NextResponse.json(
      { error: "Không thể tạo user (kiểm tra cấu hình server)" },
      { status: 500 },
    );
  }

  // Determine role_id
  let finalRoleId = role_id;
  if (!finalRoleId && role_name) {
    const { data: role } = await admin
      .from("roles")
      .select("id")
      .eq("name", role_name)
      .single();
    finalRoleId = role?.id ?? null;
  }

  // Create user via Supabase Admin API (requires service role key)
  const { data: createData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

  if (createError) {
    console.error("[create-user] admin.createUser error:", createError);
    return NextResponse.json(
      { error: createError.message || "Không thể tạo user" },
      { status: 500 },
    );
  }

  if (!createData.user) {
    return NextResponse.json(
      { error: "Không thể tạo user" },
      { status: 500 },
    );
  }

  // Update the auto-created profile with role (trigger only sets id, email, full_name)
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      full_name: full_name || null,
      phone: phone || null,
      role_id: finalRoleId,
      email,
    })
    .eq("id", createData.user.id);

  if (updateError) {
    console.error("[create-user] profile update error:", updateError);
    // User was created; still return success but log the issue
  }

  return NextResponse.json({ userId: createData.user.id });
}
