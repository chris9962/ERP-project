# Tài liệu API – ERP System

Tài liệu mô tả toàn bộ logic của các API trong dự án.

---

## Mục lục

1. [Auth](#1-auth)
2. [Profile](#2-profile)
3. [Điểm danh (Attendance)](#3-điểm-danh-attendance)
4. [Phòng ban (Departments)](#4-phòng-ban-departments)
5. [Nhân viên (Employees)](#5-nhân-viên-employees)
6. [Lương nhân viên (Salary history)](#6-lương-nhân-viên-salary-history)
7. [Cấu hình lương (Salary config)](#7-cấu-hình-lương-salary-config)
8. [Admin – User / Roles / Create / Delete](#8-admin--user--roles--create--delete)
9. [Báo cáo (Reports)](#9-báo-cáo-reports)

---

## 1. Auth

### `GET /api/auth/me`

**Mục đích:** Lấy thông tin user đang đăng nhập và profile (kèm role).

**Logic:**

1. Gọi `supabase.auth.getUser()` (từ cookie/session).
2. Nếu không có user → trả về `{ user: null, profile: null }`.
3. Nếu có user → query bảng `profiles` theo `id = user.id`.
4. Nếu không có profile → trả về `{ user, profile: null }`.
5. Nếu có `profile.role_id` → query bảng `roles` lấy `name`, gắn vào `profile.roles`.
6. Trả về `{ user, profile }` (profile đã có thêm `roles: { name }`).

**Response:** `{ user, profile }` — dùng cho header, sidebar, phân quyền.

---

## 2. Profile

### `PATCH /api/profile`

**Mục đích:** Cập nhật thông tin cá nhân của user đang đăng nhập.

**Logic:**

1. Lấy user từ `supabase.auth.getUser()`. Nếu không có → 401 Unauthorized.
2. Body: `{ full_name, phone }`.
3. Update bảng `profiles` với `full_name`, `phone` tại `id = user.id`.
4. Trả về bản ghi profile sau khi update.

**Phân quyền:** Chỉ user đó (theo session).

---

## 3. Điểm danh (Attendance)

### `GET /api/attendance?date=YYYY-MM-DD`

**Mục đích:** Lấy danh sách nhân viên active và trạng thái điểm danh theo ngày để hiển thị form điểm danh.

**Query:**

- `date` (bắt buộc): ngày cần xem/sửa điểm danh.

**Logic:**

1. Gọi song song 3 query:
   - **employees:** `status = 'active'`, có `departments(id, name)`, sort `employee_code`.
   - **departments:** toàn bộ phòng ban (để filter/lọc).
   - **attendance:** các bản ghi `date = date` (employee_id, value, note).
2. Với mỗi nhân viên, tìm bản ghi attendance tương ứng:
   - Có bản ghi → `value`, `note` từ DB, `existing: true`.
   - Không có → mặc định `value: 1` (đủ ngày), `note: ""`, `existing: false`.
3. Trả về:
   - `employees`: danh sách nhân viên active.
   - `departments`: danh sách phòng ban.
   - `entries`: object `{ [employeeId]: { employeeId, value, note, existing } }`.

**Giá trị `value`:** 0 = vắng, 0.5 = nửa ngày, 1 = đủ ngày, 1.5 = tăng ca.

---

### `POST /api/attendance`

**Mục đích:** Lưu toàn bộ điểm danh cho một ngày (ghi đè dữ liệu cũ của ngày đó).

**Body:**

```json
{
  "date": "YYYY-MM-DD",
  "entries": [
    { "employeeId": "uuid", "value": 1, "note": "..." }
  ]
}
```

**Logic:**

1. Kiểm tra `date` và `entries` có và không rỗng → thiếu thì 400.
2. Lấy `user.id` (người ghi nhận, có thể null).
3. Chuyển `entries` thành các bản ghi: `employee_id`, `date`, `value`, `note`, `noted_by`.
4. **Xóa toàn bộ** bản ghi attendance của `date` đó.
5. **Insert** danh sách mới.
6. Trả về `{ ok: true }`.

**Lưu ý:** Mỗi ngày chỉ giữ một bộ dữ liệu điểm danh; mỗi lần gửi là thay thế hết.

---

## 4. Phòng ban (Departments)

### `GET /api/departments`

**Logic:** Select toàn bộ bảng `departments`, sort theo `name`. Trả về mảng.

---

### `POST /api/departments`

**Body:** `{ name, description }`.

**Logic:** Insert một phòng ban mới (`name` bắt buộc, `description` có thể null). Trả về bản ghi vừa tạo.

---

### `PATCH /api/departments/[id]`

**Body:** `{ name, description }`.

**Logic:** Update phòng ban có `id` tương ứng. Trả về bản ghi sau update.

---

### `DELETE /api/departments/[id]`

**Logic:** Xóa bản ghi `departments` có `id`. Trả về `{ ok: true }`. (Quan hệ với `employees` tùy DB: có thể null `department_id` hoặc ràng buộc khác.)

---

## 5. Nhân viên (Employees)

### `GET /api/employees`

**Logic:**

- Select bảng `employees` kèm `departments(name)` và `profiles(full_name, email)`.
- Sort theo `created_at` giảm dần.
- Trả về mảng (danh sách tất cả nhân viên, mọi trạng thái).

---

### `POST /api/employees`

**Mục đích:** Tạo nhân viên mới (thường gọi sau khi đã tạo user qua `/api/admin/create-user`).

**Body:**  
`profile_id`, `full_name`, `cccd_number`, `employee_code`, `department_id`, `employment_type`, `start_date`, `status`, `salary_amount`, `salary_reason`.

**Logic:**

1. Insert vào `employees` với các field tương ứng (mặc định `employment_type: 'full_time'`, `status: 'active'` nếu không gửi).
2. Nếu có `salary_amount` và insert employee thành công:
   - Insert thêm một bản ghi vào `salary_history`:
     - `employee_id` = id nhân viên vừa tạo,
     - `salary_amount`, `effective_date` = `start_date` hoặc hôm nay,
     - `reason` = `salary_reason` hoặc mặc định.
3. Trả về bản ghi employee vừa tạo.

---

### `GET /api/employees/[id]`

**Logic:** Lấy một nhân viên theo `id`, kèm `departments(name)` và `profiles(full_name, email)`. Không tìm thấy → 404.

---

### `PATCH /api/employees/[id]`

**Body:** `full_name`, `employee_code`, `cccd_number`, `department_id`, `employment_type`, `status` (chỉ gửi field cần sửa).

**Logic:** Chỉ update những field có trong body (khác `undefined`). Trả về bản ghi sau update.

---

### `GET /api/employees/[id]/full`

**Mục đích:** Lấy đủ dữ liệu để hiển thị trang chi tiết nhân viên (thông tin + lịch sử lương + điểm danh gần đây).

**Logic:**

1. Gọi song song 4 query:
   - Employee theo `id` (kèm departments, profiles).
   - Danh sách `departments` (để dropdown chỉnh sửa).
   - `salary_history` của nhân viên, sort `effective_date` giảm dần.
   - `attendance` của nhân viên, sort `date` giảm dần, limit 30.
2. Trả về:
   - `employee`
   - `departments`
   - `salaryHistory`
   - `attendance`

---

## 6. Lương nhân viên (Salary history)

### `GET /api/employees/[id]/salary`

**Logic:**

- Lấy employee (id, full_name, employee_code).
- Lấy toàn bộ `salary_history` của nhân viên đó, sort `effective_date` giảm dần.
- Trả về `{ employee, records }`.  
- “Lương hiện tại” trên UI = bản ghi có `end_date = null` (hoặc mới nhất theo ngày áp dụng).

---

### `POST /api/employees/[id]/salary`

**Mục đích:** Thêm mức lương mới và (tùy chọn) kết thúc mức lương cũ.

**Body:**  
`salary_amount`, `effective_date`, `reason`, `current_record_id`, `current_end_date`.

**Logic:**

1. Nếu có `current_record_id` và `current_end_date`:
   - Update bản ghi lương cũ: set `end_date = current_end_date` (thường là ngày trước `effective_date`).
2. Insert bản ghi mới vào `salary_history`:
   - `employee_id`, `salary_amount`, `effective_date`, `reason`, `created_by` (user hiện tại).
3. Trả về bản ghi vừa insert.

**Cách hiển thị “lương hiện tại”:** Bản ghi có `end_date IS NULL` (đang áp dụng).

---

## 7. Cấu hình lương (Salary config)

### `GET /api/salary-config`

**Logic:** Select toàn bộ `salary_config`, sort theo `employment_type`. Dùng cho màn Cấu hình lương (lương ngày mặc định, hệ số tăng ca theo loại nhân viên).

---

### `PATCH /api/salary-config`

**Body:** `id`, `default_daily_rate`, `overtime_multiplier`.

**Logic:** Update bản ghi `salary_config` có `id` tương ứng (và cập nhật `updated_at`). Trả về bản ghi sau update.

**Lưu ý:** Hiện tại báo cáo lương chưa dùng `salary_config`; lương lấy từ `salary_history` và công thức cố định `(salary_amount / 26) * totalDays`.

---

## 8. Admin – User / Roles / Create / Delete

### `GET /api/admin/roles`

**Logic:** Select toàn bộ bảng `roles`, sort theo `name`. Dùng cho dropdown role khi tạo/sửa user.

---

### `GET /api/admin/users`

**Logic:**

- Select toàn bộ `profiles`, sort `created_at` giảm dần.
- Select toàn bộ `roles` → build `rolesMap` theo id.
- Gắn vào mỗi profile: `roles: { name }` từ `rolesMap` theo `profile.role_id`.
- Trả về mảng profiles (có thêm `roles`).  
**Phân quyền:** Nên chỉ admin (hiện tại route không kiểm tra; có thể bảo vệ bằng RLS hoặc middleware).

---

### `PATCH /api/admin/users`

**Body:** `userId`, và tùy chọn: `action`, `full_name`, `phone`, `role_id`, `is_active`.

**Logic:**

1. Bắt buộc có `userId`, thiếu → 400.
2. Nếu `action === "toggleActive"` và `is_active` là boolean:
   - Chỉ update `profiles.is_active` tại `id = userId`, trả về profile.
3. Ngược lại:
   - Chỉ đưa vào object update những field có gửi: `full_name`, `phone`, `role_id` (null được phép).
   - Update `profiles` tại `id = userId`, trả về profile.

---

### `POST /api/admin/create-user`

**Mục đích:** Tạo user trong Supabase Auth và profile (chỉ admin).

**Phân quyền:**

1. Lấy user từ session (client thường).
2. Query `profiles` + `roles(name)` theo `user.id`.
3. Chỉ cho phép khi `roles.name === 'admin'`. Không đăng nhập → 401; không phải admin → 403.

**Body:** `email`, `password`, `full_name`, `phone`, `role_id`, `role_name`.

**Logic:**

1. Validate: phải có `email` và `password` → thiếu thì 400.
2. Tạo **admin client** (service role). Lỗi (ví dụ thiếu `SUPABASE_SERVICE_ROLE_KEY`) → 500.
3. Xác định `role_id`:
   - Nếu body có `role_id` → dùng.
   - Nếu không nhưng có `role_name` → query bảng `roles` theo `name` để lấy `id`.
4. Gọi **admin client**: `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`.
   - Lỗi từ Supabase → 500, message lỗi trả về client.
5. Sau khi tạo user thành công:
   - Update bảng `profiles` tại `id = newUser.id`: `full_name`, `phone`, `role_id`, `email` (trigger tạo profile thường chỉ set id, email, full_name từ metadata).
6. Trả về `{ userId: newUser.id }`.

**Lưu ý:** Admin client dùng `SUPABASE_SERVICE_ROLE_KEY`; client thường chỉ dùng để kiểm tra quyền admin.

---

### `POST /api/admin/delete-user`

**Mục đích:** Xóa user (chỉ admin), gồm employee, profile và auth user.

**Phân quyền:** Giống create-user — chỉ role `admin`.

**Body:** `{ userId }`.

**Logic:**

1. Thiếu `userId` → 400.
2. Không cho xóa chính mình: `userId === user.id` → 400.
3. Xóa bản ghi `employees` có `profile_id = userId`.
4. Xóa bản ghi `profiles` có `id = userId`.
5. Gọi `supabase.auth.admin.deleteUser(userId)`.

**Lưu ý:** `auth.admin.deleteUser` cần quyền admin (service role). Nếu dùng client thường (anon key) có thể lỗi; khi đó cần gọi qua admin client giống create-user.

---

## 9. Báo cáo (Reports)

### `GET /api/reports/salary`

**Mục đích:** Báo cáo lương theo kỳ (từ ngày – đến ngày), theo từng nhân viên active.

**Query:** `from`, `to`, `departmentId` (tùy chọn, `"all"` = không lọc phòng ban).

**Logic (cho từng nhân viên active, có thể lọc theo department):**

1. **Lương áp dụng trong kỳ:**
   - Query `salary_history`: `employee_id`, `effective_date <= to`, và (`end_date IS NULL` hoặc `end_date >= from`), sort `effective_date` giảm dần, lấy 1 bản ghi.
   - `salary_amount` = mức lương tháng đang áp dụng trong kỳ (VND).

2. **Ngày công trong kỳ:**
   - Query `attendance`: `employee_id`, `date` trong [from, to].
   - `total_days` = tổng các cột `value` (0.5, 1, 1.5…).

3. **Tổng lương kỳ:**
   - Công thức: **`total_salary = (salary_amount / 26) * total_days`**
   - 26 = số ngày công chuẩn/tháng; `salary_amount` coi là lương tháng.

**Response:** Mảng mỗi phần tử: `employee_id`, `employee_code`, `full_name`, `department_name`, `salary_amount`, `total_days`, `total_salary`.

---

### `GET /api/reports/attendance`

**Mục đích:** Báo cáo điểm danh theo kỳ: tổng hợp số ngày công, vắng, nửa ngày, đủ ngày, tăng ca.

**Query:** `from`, `to`, `departmentId` (tùy chọn).

**Logic (cho từng nhân viên active, có thể lọc theo department):**

1. Query `attendance` của nhân viên trong [from, to].
2. Với mỗi bản ghi, `value`:
   - 0 → vắng
   - 0.5 → nửa ngày
   - 1 → đủ ngày
   - 1.5 → tăng ca
3. Tính:
   - `total_days` = tổng `value`.
   - `absent_days` = số bản ghi có `value === 0`.
   - `half_days` = số bản ghi có `value === 0.5`.
   - `full_days` = số bản ghi có `value === 1`.
   - `overtime_days` = số bản ghi có `value === 1.5`.

**Response:** Mảng mỗi phần tử: `employee_id`, `employee_code`, `full_name`, `department_name`, `total_days`, `absent_days`, `half_days`, `full_days`, `overtime_days`.

---

## Tóm tắt bảng và luồng chính

| API nhóm        | Bảng chính        | Ghi chú |
|-----------------|-------------------|--------|
| Auth / Profile  | `profiles`, `roles` | Session từ Supabase Auth |
| Attendance      | `attendance`, `employees` | value: 0 / 0.5 / 1 / 1.5 |
| Departments     | `departments`     | CRUD đơn giản |
| Employees       | `employees`, `profiles`, `departments` | Tạo NV có thể kèm salary_history |
| Salary (NV)     | `salary_history`  | Lương hiện tại = bản ghi end_date null |
| Salary config   | `salary_config`   | Lương ngày mặc định, hệ số tăng ca |
| Admin           | `profiles`, `roles`, Auth Admin API | Create/delete user cần service role |
| Reports         | `employees`, `attendance`, `salary_history` | Lương: (salary_amount/26)*total_days |

File này mô tả đúng logic hiện tại trong code; khi đổi API hoặc công thức, nên cập nhật lại tài liệu.
