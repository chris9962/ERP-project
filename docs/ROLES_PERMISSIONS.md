# Phân quyền theo Role (RLS Policies)

> Tài liệu mô tả chi tiết quyền truy cập dữ liệu của từng role trong hệ thống, dựa trên Row Level Security (RLS) của Supabase.

## Tổng quan các Role

| Role             | Mô tả                                   |
| ---------------- | --------------------------------------- |
| **admin**        | Quản trị hệ thống, quản lý toàn bộ user |
| **owner**        | Chủ doanh nghiệp, xem báo cáo thống kê  |
| **manager**      | Quản lý, điểm danh và quản lý nhân viên |
| **office_staff** | Nhân viên hành chính, điểm danh         |
| **worker**       | Công nhân, xem thông tin cá nhân        |

---

## Ma trận quyền tổng hợp

> **Chú thích:** `✅` = Toàn bộ | `🔒` = Chỉ dữ liệu của mình | `❌` = Không có quyền

### Bảng `roles`

| Thao tác | admin | owner | manager | office_staff | worker |
| -------- | ----- | ----- | ------- | ------------ | ------ |
| SELECT   | ✅    | ✅    | ✅      | ✅           | ✅     |
| INSERT   | ❌    | ❌    | ❌      | ❌           | ❌     |
| UPDATE   | ❌    | ❌    | ❌      | ❌           | ❌     |
| DELETE   | ❌    | ❌    | ❌      | ❌           | ❌     |

> Tất cả user đã đăng nhập đều đọc được danh sách role. Không ai được thêm/sửa/xóa role.

---

### Bảng `profiles`

| Thao tác | admin | owner | manager | office_staff | worker |
| -------- | ----- | ----- | ------- | ------------ | ------ |
| SELECT   | ✅    | ✅    | 🔒      | 🔒           | 🔒     |
| INSERT   | ✅    | ✅    | 🔒      | 🔒           | 🔒     |
| UPDATE   | ✅    | ✅    | 🔒      | 🔒           | 🔒     |
| DELETE   | ✅    | ✅    | ❌      | ❌           | ❌     |

> - Admin/Owner: đọc, thêm, sửa, xóa tất cả profiles.
> - Các role khác: chỉ đọc và sửa profile của chính mình. Tự tạo profile khi đăng ký (trigger tự động).

---

### Bảng `departments`

| Thao tác | admin | owner | manager | office_staff | worker |
| -------- | ----- | ----- | ------- | ------------ | ------ |
| SELECT   | ✅    | ✅    | ✅      | ✅           | ✅     |
| INSERT   | ✅    | ✅    | ❌      | ❌           | ❌     |
| UPDATE   | ✅    | ✅    | ❌      | ❌           | ❌     |
| DELETE   | ✅    | ✅    | ❌      | ❌           | ❌     |

> - Tất cả user đã đăng nhập đều đọc được danh sách phòng ban.
> - Chỉ Admin/Owner được thêm, sửa, xóa phòng ban.

---

### Bảng `employees`

| Thao tác | admin | owner | manager | office_staff | worker |
| -------- | ----- | ----- | ------- | ------------ | ------ |
| SELECT   | ✅    | ✅    | ✅      | ✅           | 🔒     |
| INSERT   | ✅    | ✅    | ✅      | ✅           | ❌     |
| UPDATE   | ✅    | ✅    | ✅      | ✅           | ❌     |
| DELETE   | ✅    | ✅    | ❌      | ❌           | ❌     |

> - Admin/Owner/Manager/Office Staff: đọc, thêm, sửa tất cả nhân viên.
> - Worker: chỉ xem hồ sơ nhân viên của chính mình (qua `profile_id`).
> - Chỉ Admin/Owner được xóa nhân viên.

---

### Bảng `attendance`

| Thao tác | admin | owner | manager | office_staff | worker |
| -------- | ----- | ----- | ------- | ------------ | ------ |
| SELECT   | ✅    | ✅    | ✅      | ✅           | 🔒     |
| INSERT   | ✅    | ✅    | ✅      | ✅           | ❌     |
| UPDATE   | ✅    | ✅    | ✅      | ✅           | ❌     |
| DELETE   | ✅    | ✅    | ✅      | ✅           | ❌     |

> - Admin/Owner/Manager/Office Staff: toàn quyền CRUD trên bảng điểm danh.
> - Worker: chỉ xem dữ liệu điểm danh của chính mình.

---

### Bảng `salary_history`

| Thao tác | admin | owner | manager | office_staff | worker |
| -------- | ----- | ----- | ------- | ------------ | ------ |
| SELECT   | ✅    | ✅    | ✅      | ❌           | 🔒     |
| INSERT   | ✅    | ✅    | ✅      | ❌           | ❌     |
| UPDATE   | ✅    | ✅    | ✅      | ❌           | ❌     |
| DELETE   | ❌    | ❌    | ❌      | ❌           | ❌     |

> - Admin/Owner/Manager: đọc, thêm, sửa lịch sử lương tất cả nhân viên.
> - Worker: chỉ xem lịch sử lương của chính mình.
> - Office Staff: không có quyền truy cập.
> - Không ai được xóa lịch sử lương (không có policy DELETE).

---

### Bảng `salary_config`

| Thao tác | admin | owner | manager | office_staff | worker |
| -------- | ----- | ----- | ------- | ------------ | ------ |
| SELECT   | ✅    | ✅    | ✅      | ✅           | ✅     |
| INSERT   | ❌    | ❌    | ❌      | ❌           | ❌     |
| UPDATE   | ✅    | ✅    | ❌      | ❌           | ❌     |
| DELETE   | ❌    | ❌    | ❌      | ❌           | ❌     |

> - Tất cả user đã đăng nhập đều đọc được cấu hình lương.
> - Chỉ Admin/Owner được cập nhật cấu hình lương.
> - Không có policy INSERT/DELETE (dữ liệu được seed sẵn).

---

## Chi tiết quyền theo từng Role

### 1. Admin

Quyền cao nhất trong hệ thống. Toàn quyền trên mọi bảng (trừ xóa `salary_history` và sửa `roles`).

| Bảng           | SELECT | INSERT | UPDATE | DELETE |
| -------------- | ------ | ------ | ------ | ------ |
| roles          | ✅     | ❌     | ❌     | ❌     |
| profiles       | ✅     | ✅     | ✅     | ✅     |
| departments    | ✅     | ✅     | ✅     | ✅     |
| employees      | ✅     | ✅     | ✅     | ✅     |
| attendance     | ✅     | ✅     | ✅     | ✅     |
| salary_history | ✅     | ✅     | ✅     | ❌     |
| salary_config  | ✅     | ❌     | ✅     | ❌     |

---

### 2. Owner

Tương đương Admin về quyền truy cập dữ liệu.

| Bảng           | SELECT | INSERT | UPDATE | DELETE |
| -------------- | ------ | ------ | ------ | ------ |
| roles          | ✅     | ❌     | ❌     | ❌     |
| profiles       | ✅     | ✅     | ✅     | ✅     |
| departments    | ✅     | ✅     | ✅     | ✅     |
| employees      | ✅     | ✅     | ✅     | ✅     |
| attendance     | ✅     | ✅     | ✅     | ✅     |
| salary_history | ✅     | ✅     | ✅     | ❌     |
| salary_config  | ✅     | ❌     | ✅     | ❌     |

---

### 3. Manager

Quản lý nhân viên, điểm danh, và lương. Không quản lý phòng ban hay user.

| Bảng           | SELECT | INSERT | UPDATE | DELETE |
| -------------- | ------ | ------ | ------ | ------ |
| roles          | ✅     | ❌     | ❌     | ❌     |
| profiles       | 🔒     | 🔒     | 🔒     | ❌     |
| departments    | ✅     | ❌     | ❌     | ❌     |
| employees      | ✅     | ✅     | ✅     | ❌     |
| attendance     | ✅     | ✅     | ✅     | ✅     |
| salary_history | ✅     | ✅     | ✅     | ❌     |
| salary_config  | ✅     | ❌     | ❌     | ❌     |

---

### 4. Office Staff

Nhân viên hành chính, chủ yếu quản lý nhân viên và điểm danh. Không truy cập lương.

| Bảng           | SELECT | INSERT | UPDATE | DELETE |
| -------------- | ------ | ------ | ------ | ------ |
| roles          | ✅     | ❌     | ❌     | ❌     |
| profiles       | 🔒     | 🔒     | 🔒     | ❌     |
| departments    | ✅     | ❌     | ❌     | ❌     |
| employees      | ✅     | ✅     | ✅     | ❌     |
| attendance     | ✅     | ✅     | ✅     | ✅     |
| salary_history | ❌     | ❌     | ❌     | ❌     |
| salary_config  | ✅     | ❌     | ❌     | ❌     |

---

### 5. Worker

Quyền thấp nhất. Chỉ xem dữ liệu liên quan đến bản thân.

| Bảng           | SELECT | INSERT | UPDATE | DELETE |
| -------------- | ------ | ------ | ------ | ------ |
| roles          | ✅     | ❌     | ❌     | ❌     |
| profiles       | 🔒     | 🔒     | 🔒     | ❌     |
| departments    | ✅     | ❌     | ❌     | ❌     |
| employees      | 🔒     | ❌     | ❌     | ❌     |
| attendance     | 🔒     | ❌     | ❌     | ❌     |
| salary_history | 🔒     | ❌     | ❌     | ❌     |
| salary_config  | ✅     | ❌     | ❌     | ❌     |

---

## Ghi chú kỹ thuật

- Tất cả quyền được thực thi qua **Row Level Security (RLS)** của Supabase/PostgreSQL.
- Helper function `get_user_role(user_id)` trả về tên role của user, sử dụng `SECURITY DEFINER` để bypass RLS khi kiểm tra quyền.
- Profile được tự động tạo khi user đăng ký qua trigger `on_auth_user_created`.
- Dữ liệu `salary_config` được seed sẵn (full_time/part_time), không có policy INSERT.
- Dữ liệu `salary_history` không có policy DELETE để đảm bảo tính toàn vẹn lịch sử lương.
