import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify caller is admin
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

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json(
      { error: "userId là bắt buộc" },
      { status: 400 },
    );
  }

  // Prevent self-delete
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Không thể xóa chính mình" },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[delete-user] createAdminClient failed:", e);
    return NextResponse.json(
      { error: "Cấu hình server thiếu quyền xóa user (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 },
    );
  }

  // Delete employee record if exists (admin client bypasses RLS)
  const { error: empErr } = await admin
    .from("employees")
    .delete()
    .eq("profile_id", userId);
  if (empErr) {
    console.error("[delete-user] employees delete failed:", empErr);
    return NextResponse.json(
      { error: "Không thể xóa bản ghi nhân viên: " + empErr.message },
      { status: 500 },
    );
  }

  // Clear attendance.noted_by references to this profile (FK attendance_noted_by_fkey)
  const { error: attErr } = await admin
    .from("attendance")
    .update({ noted_by: null })
    .eq("noted_by", userId);
  if (attErr) {
    console.error("[delete-user] attendance noted_by clear failed:", attErr);
    return NextResponse.json(
      { error: "Không thể cập nhật bảng chấm công: " + attErr.message },
      { status: 500 },
    );
  }

  // Clear salary_periods.finalized_by references to this profile
  const { error: periodErr } = await admin
    .from("salary_periods")
    .update({ finalized_by: null })
    .eq("finalized_by", userId);
  if (periodErr) {
    console.error("[delete-user] salary_periods finalized_by clear failed:", periodErr);
    return NextResponse.json(
      { error: "Không thể cập nhật kỳ lương: " + periodErr.message },
      { status: 500 },
    );
  }

  // Delete profile
  const { error: profileErr } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profileErr) {
    console.error("[delete-user] profiles delete failed:", profileErr);
    return NextResponse.json(
      { error: "Không thể xóa profile: " + profileErr.message },
      { status: 500 },
    );
  }

  // Delete auth user (requires service role key)
  const { error: authErr } = await admin.auth.admin.deleteUser(userId);
  if (authErr) {
    console.error("[delete-user] auth.admin.deleteUser failed:", authErr);
    return NextResponse.json(
      { error: "Không thể xóa tài khoản đăng nhập: " + authErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
