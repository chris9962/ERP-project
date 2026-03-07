# Database Design - ERP Project

## Tổng quan tính năng

- **Login/Auth**: Đăng nhập qua Supabase Auth
- **Admin**: Quản lý toàn bộ user trong hệ thống
- **Owner**: Xem báo cáo thống kê
- **Quản lý/Hành chính**: Điểm danh nhân viên, quản lý nhân viên
- **Nhân viên**: Scan QR trên CCCD để thêm nhân viên
- **Điểm danh**: Bảng hiển thị tất cả nhân viên, mỗi hàng có 4 option (0.5, 1, 1.5, vắng), save 1 lần cho tất cả
- **Báo cáo lương**: Dựa vào điểm danh, xem theo tuần/tháng/năm

---

## Các bảng

### 1. `roles`

| Cột         | Kiểu    | Ghi chú                                     |
| ----------- | ------- | ------------------------------------------- |
| id          | UUID PK |                                             |
| name        | text    | admin, owner, manager, office_staff, worker |
| description | text    |                                             |

### 2. `profiles` (Tài khoản đăng nhập)

| Cột        | Kiểu        | Ghi chú          |
| ---------- | ----------- | ---------------- |
| id         | UUID PK     | FK -> auth.users |
| full_name  | text        |                  |
| phone      | text        |                  |
| email      | text        |                  |
| avatar_url | text        |                  |
| role_id    | UUID FK     | FK -> roles      |
| is_active  | boolean     | default true     |
| created_at | timestamptz |                  |
| updated_at | timestamptz |                  |

> Không phải tất cả nhân viên đều cần tài khoản. Admin/Owner chỉ cần profiles, không cần employees.

### 3. `departments` (Phòng ban)

| Cột         | Kiểu        | Ghi chú |
| ----------- | ----------- | ------- |
| id          | UUID PK     |         |
| name        | text        |         |
| description | text        |         |
| created_at  | timestamptz |         |

### 4. `employees` (Thông tin nhân viên)

| Cột             | Kiểu        | Ghi chú                                   |
| --------------- | ----------- | ----------------------------------------- |
| id              | UUID PK     |                                           |
| profile_id      | UUID FK     | FK -> profiles (NOT NULL)                 |
| department_id   | UUID FK     | FK -> departments                         |
| employee_code   | text        | Mã nhân viên                              |
| full_name       | text        | Tên nhân viên (dùng khi không có profile) |
| cccd_number     | text        | Số CCCD - dùng cho QR scan                |
| employment_type | text        | full_time, part_time                      |
| start_date      | date        | Ngày vào làm                              |
| status          | text        | active, inactive, resigned                |
| created_at      | timestamptz |                                           |
| updated_at      | timestamptz |                                           |

> Tat ca nhan vien deu co tai khoan. Khi them nhan vien: `createUser()` → `profiles` → `employees`.

### 5. `salary_history` (Lịch sử lương)

| Cột            | Kiểu        | Ghi chú                         |
| -------------- | ----------- | ------------------------------- |
| id             | UUID PK     |                                 |
| employee_id    | UUID FK     | FK -> employees                 |
| salary_amount  | numeric     | Mức lương                       |
| effective_date | date        | Ngày bắt đầu áp dụng            |
| end_date       | date        | NULL = đang áp dụng             |
| reason         | text        | Lý do điều chỉnh                |
| created_by     | UUID FK     | FK -> profiles (người cập nhật) |
| created_at     | timestamptz |                                 |

> Không lưu lương trực tiếp trên employees. Mỗi lần thay đổi lương tạo record mới, đóng record cũ. Đảm bảo báo cáo luôn chính xác theo thời điểm.

**Ví dụ:**

```
Nhân viên A:
| salary_amount | effective_date | end_date   |
|---------------|----------------|------------|
| 8,000,000     | 2026-01-01     | 2026-06-30 |
| 10,000,000    | 2026-07-01     | NULL       | ← hiện tại
```

### 6. `attendance` (Điểm danh)

| Cột         | Kiểu        | Ghi chú                          |
| ----------- | ----------- | -------------------------------- |
| id          | UUID PK     |                                  |
| employee_id | UUID FK     | FK -> employees                  |
| date        | date        |                                  |
| value       | numeric     | 0 = vắng, 0.5, 1, 1.5            |
| noted_by    | UUID FK     | FK -> profiles (người điểm danh) |
| note        | text        |                                  |
| created_at  | timestamptz |                                  |

> UNIQUE(employee_id, date) - mỗi nhân viên chỉ có 1 record điểm danh/ngày.

### 7. `salary_config` (Cấu hình lương chung)

| Cột                 | Kiểu        | Ghi chú                 |
| ------------------- | ----------- | ----------------------- |
| id                  | UUID PK     |                         |
| employment_type     | text        | full_time, part_time    |
| default_daily_rate  | numeric     | Mức lương ngày mặc định |
| overtime_multiplier | numeric     | Hệ số tăng ca           |
| created_at          | timestamptz |                         |
| updated_at          | timestamptz |                         |

---

## Quan hệ giữa các bảng

```
auth.users (Supabase Auth)
    └── profiles (1:1) ─── Tài khoản đăng nhập
            │
            ├── roles (N:1) ─── Phân quyền
            │
            └── employees (1:1) ─── Thông tin nhân viên
                    │
                    ├── departments (N:1) ─── Phòng ban
                    │
                    ├── salary_history (1:N) ─── Lịch sử lương
                    │
                    └── attendance (1:N) ─── Điểm danh
```

## Phân biệt profiles vs employees

```
┌─────────────┐            ┌─────────────┐
│  profiles    │   1 : 1    │  employees  │
│ (tài khoản) │────────────│ (nhân viên) │
└─────────────┘            └─────────────┘

- Admin/Owner      : chi co profiles (khong di lam, khong diem danh)
- Quan ly/Hanh chinh: profiles + employees
- Cong nhan        : profiles + employees (dang nhap xem profile)
```

---

## Flow nghiệp vụ

> **Khong co dang ky.** Chi admin moi tao duoc tai khoan. Nhan vien chi login.

1. **Admin tao user** -> Dung Supabase Admin API (`supabase.auth.admin.createUser()`) -> trigger tu tao `profiles` -> Admin gan role + tao employee (neu can) -> Gui thong tin dang nhap cho nhan vien
2. **Login** -> Nhan vien dang nhap bang tai khoan duoc admin cap
3. **Admin** -> CRUD tat ca bang, gan role cho user
4. **Quan ly/Hanh chinh** -> Scan QR CCCD -> tim employee -> them moi hoac diem danh
5. **Diem danh** -> Load danh sach employees -> chon value (0, 0.5, 1, 1.5) -> bulk save vao `attendance`
6. **Cap nhat luong** -> Dong salary_history cu + tao record moi
7. **Bao cao** -> Query `attendance` JOIN `salary_history` -> tinh luong chinh xac theo thoi diem

### Query báo cáo lương (ví dụ tháng 3/2026)

```sql
SELECT
  e.employee_code,
  e.full_name,
  sh.salary_amount,
  SUM(a.value) as total_days,
  (sh.salary_amount / 26) * SUM(a.value) as total_salary
FROM employees e
JOIN salary_history sh ON sh.employee_id = e.id
  AND sh.effective_date <= '2026-03-31'
  AND (sh.end_date IS NULL OR sh.end_date >= '2026-03-01')
JOIN attendance a ON a.employee_id = e.id
  AND a.date BETWEEN '2026-03-01' AND '2026-03-31'
GROUP BY e.id, e.employee_code, e.full_name, sh.salary_amount;
```

---

## Tool & Migration

- **Supabase CLI** để quản lý migration
- Migration files lưu trong `supabase/migrations/`
