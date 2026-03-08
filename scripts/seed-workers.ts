import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Worker@123";

const WORKERS = [
  {
    email: "hung.nv@legifood.local",
    full_name: "Nguyễn Văn Hùng",
    phone: "0901000001",
    employee_code: "NV001",
    cccd_number: "079200001001",
    employment_type: "full_time" as const,
  },
  {
    email: "mai.tt@legifood.local",
    full_name: "Trần Thị Mai",
    phone: "0901000002",
    employee_code: "NV002",
    cccd_number: "079200001002",
    employment_type: "full_time" as const,
  },
  {
    email: "duc.lv@legifood.local",
    full_name: "Lê Văn Đức",
    phone: "0901000003",
    employee_code: "NV003",
    cccd_number: "079200001003",
    employment_type: "full_time" as const,
  },
  {
    email: "lan.pt@legifood.local",
    full_name: "Phạm Thị Lan",
    phone: "0901000004",
    employee_code: "NV004",
    cccd_number: "079200001004",
    employment_type: "full_time" as const,
  },
  {
    email: "tu.hv@legifood.local",
    full_name: "Hoàng Văn Tú",
    phone: "0901000005",
    employee_code: "NV005",
    cccd_number: "079200001005",
    employment_type: "part_time" as const,
  },
  {
    email: "huong.nt@legifood.local",
    full_name: "Ngô Thị Hương",
    phone: "0901000006",
    employee_code: "NV006",
    cccd_number: "079200001006",
    employment_type: "full_time" as const,
  },
  {
    email: "phong.dv@legifood.local",
    full_name: "Đặng Văn Phong",
    phone: "0901000007",
    employee_code: "NV007",
    cccd_number: "079200001007",
    employment_type: "full_time" as const,
  },
  {
    email: "ngoc.bt@legifood.local",
    full_name: "Bùi Thị Ngọc",
    phone: "0901000008",
    employee_code: "NV008",
    cccd_number: "079200001008",
    employment_type: "part_time" as const,
  },
  {
    email: "thanh.vv@legifood.local",
    full_name: "Vũ Văn Thành",
    phone: "0901000009",
    employee_code: "NV009",
    cccd_number: "079200001009",
    employment_type: "full_time" as const,
  },
  {
    email: "yen.dt@legifood.local",
    full_name: "Đinh Thị Yến",
    phone: "0901000010",
    employee_code: "NV010",
    cccd_number: "079200001010",
    employment_type: "part_time" as const,
  },
];

async function main() {
  // 1. Get worker role id
  const { data: workerRole, error: roleErr } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "worker")
    .single();

  if (roleErr || !workerRole) {
    console.error("Cannot find worker role:", roleErr?.message);
    process.exit(1);
  }

  console.log(`Worker role id: ${workerRole.id}`);
  console.log(`Password for all: ${PASSWORD}`);
  console.log("---");

  let success = 0;
  let failed = 0;

  for (const w of WORKERS) {
    // 2. Create auth user (trigger auto-creates profile)
    const { data: authData, error: authErr } =
      await supabase.auth.admin.createUser({
        email: w.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: w.full_name },
      });

    if (authErr || !authData.user) {
      console.error(`[FAIL] ${w.full_name}: ${authErr?.message}`);
      failed++;
      continue;
    }

    const userId = authData.user.id;

    // 3. Update profile: set role + phone
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ role_id: workerRole.id, phone: w.phone })
      .eq("id", userId);

    if (profileErr) {
      console.error(`[WARN] ${w.full_name} profile update: ${profileErr.message}`);
    }

    // 4. Create employee record
    const { error: empErr } = await supabase.from("employees").insert({
      profile_id: userId,
      full_name: w.full_name,
      employee_code: w.employee_code,
      cccd_number: w.cccd_number,
      employment_type: w.employment_type,
      start_date: "2026-01-01",
    });

    if (empErr) {
      console.error(`[WARN] ${w.full_name} employee insert: ${empErr.message}`);
    }

    console.log(`[OK] ${w.employee_code} - ${w.full_name} (${w.email})`);
    success++;
  }

  console.log("---");
  console.log(`Done: ${success} success, ${failed} failed`);
}

main();
