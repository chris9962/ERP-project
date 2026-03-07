# Frontend Design - ERP Project

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** Supabase Auth (client-side)
- **State:** React hooks + Supabase realtime (neu can)

---

## Phan quyen theo Role

> Co quyen = ✅ | Khong co quyen = ❌ | Public = 🔓

| Page                     | Admin | Owner | Manager | Office Staff | Worker |
| ------------------------ | :---: | :---: | :-----: | :----------: | :----: |
| `/login`                 |  🔓  |  🔓  |   🔓   |      🔓      |   🔓  |
| `/dashboard`             |  ✅  |  ✅  |   ✅   |      ✅      |   ✅  |
| `/profile`               |  ✅  |  ✅  |   ✅   |      ✅      |   ✅  |
| `/admin/users`           |  ✅  |  ❌  |   ❌   |      ❌      |   ❌  |
| `/admin/departments`     |  ✅  |  ❌  |   ❌   |      ❌      |   ❌  |
| `/admin/salary-config`   |  ✅  |  ❌  |   ❌   |      ❌      |   ❌  |
| `/employees`             |  ✅  |  ❌  |   ✅   |      ✅      |   ❌  |
| `/employees/new`         |  ✅  |  ❌  |   ✅   |      ✅      |   ❌  |
| `/employees/[id]`        |  ✅  |  ❌  |   ✅   |      ✅      |   ❌  |
| `/employees/[id]/salary` |  ✅  |  ❌  |   ✅   |      ❌      |   ❌  |
| `/attendance`            |  ✅  |  ❌  |   ✅   |      ✅      |   ❌  |
| `/reports/salary`        |  ✅  |  ✅  |   ❌   |      ❌      |   ❌  |
| `/reports/attendance`    |  ✅  |  ✅  |   ❌   |      ❌      |   ❌  |

---

## Pages chi tiet

### 1. `/login`

- Form: email + password
- Khong co dang ky
- Sau login redirect ve `/dashboard` theo role

### 2. `/dashboard`

Trang chinh sau login, noi dung thay doi theo role:

- **Admin:** Tong quan user, so nhan vien, link nhanh den quan ly
- **Owner:** Bieu do tong hop luong, diem danh thang hien tai
- **Manager/Office Staff:** Danh sach nhan vien, nut diem danh nhanh
- **Worker:** Thong tin ca nhan, lich su diem danh cua minh

### 3. `/profile`

- Xem thong tin ca nhan (ten, email, phone, avatar)
- Doi mat khau
- Tat ca role deu truy cap duoc

### 4. `/admin/users`

- Bang danh sach user (ten, email, role, trang thai)
- Nut "Them user" -> Modal/Form:
  - Nhap email, mat khau, ten, phone
  - Chon role (dropdown)
  - Goi `supabase.auth.admin.createUser()`
- Sua role, bat/tat trang thai user
- Xoa user

### 5. `/admin/departments`

- Bang danh sach phong ban
- CRUD phong ban (ten, mo ta)

### 6. `/admin/salary-config`

- Cau hinh luong mac dinh theo employment_type
- Bang: loai nhan vien | luong ngay mac dinh | he so tang ca
- Chinh sua inline hoac modal

### 7. `/employees`

- Bang danh sach nhan vien:
  - Ma NV | Ten | Phong ban | Loai (full/part) | Trang thai | Ngay vao lam
- Tim kiem, loc theo phong ban/trang thai
- Nut "Them nhan vien"

### 8. `/employees/new`

- 2 cach them:
  - **Scan QR CCCD:** Mo camera -> doc QR -> tu dong dien thong tin (ten, so CCCD)
  - **Nhap tay:** Form nhap thong tin
- Form fields:
  - Ten, so CCCD, ma nhan vien
  - Phong ban (dropdown)
  - Loai (full_time / part_time)
  - Ngay vao lam
  - Muc luong ban dau -> tu dong tao salary_history

### 9. `/employees/[id]`

- Thong tin chi tiet nhan vien
- Chinh sua thong tin
- Tab: Thong tin | Lich su luong | Lich su diem danh
- Nut doi trang thai (active/inactive/resigned)

### 10. `/employees/[id]/salary`

- Lich su thay doi luong (bang timeline)
- Nut "Cap nhat luong":
  - Nhap muc luong moi
  - Ngay ap dung
  - Ly do
  - -> Dong record cu, tao record moi trong salary_history

### 11. `/attendance`

- **Chon ngay** (date picker, mac dinh hom nay)
- **Bang diem danh:**

```
| STT | Ma NV | Ten        | Phong ban | 0.5 | 1 | 1.5 | Vang | Ghi chu |
|-----|-------|------------|-----------|-----|---|-----|------|---------|
| 1   | NV001 | Nguyen A   | San xuat  | ( ) |(x)| ( ) | ( )  | [     ] |
| 2   | NV002 | Tran B     | Hanh chinh| ( ) |(x)| ( ) | ( )  | [     ] |
| 3   | NV003 | Le C       | San xuat  | ( ) |( )| ( ) | (x)  | Nghi om |
```

- Moi hang la 1 nhan vien, chon 1 trong 4 option (radio)
- Mac dinh: 1 (di lam binh thuong)
- Nut **"Luu tat ca"** -> bulk insert/update vao bang attendance
- Loc theo phong ban
- Hien thi trang thai: da diem danh / chua diem danh

### 12. `/reports/salary`

- **Bo loc:** Khoang thoi gian (tuan / thang / nam), phong ban
- **Bang bao cao:**

```
| Ma NV | Ten      | Luong co ban | Ngay cong | Tong luong |
|-------|----------|-------------|-----------|------------|
| NV001 | Nguyen A | 10,000,000  | 22.5      | 9,615,385  |
| NV002 | Tran B   | 8,000,000   | 20        | 6,153,846  |
```

- Cong thuc: `tong_luong = (luong_co_ban / 26) * ngay_cong`
- Bieu do: tong chi phi luong theo thang
- Export CSV/Excel (neu can)

### 13. `/reports/attendance`

- **Bo loc:** Khoang thoi gian, phong ban, nhan vien
- **Thong ke:**
  - Tong ngay cong trung binh
  - So nguoi vang nhieu nhat
  - Ti le di lam / vang
- **Bang chi tiet:** nhan vien x ngay -> gia tri diem danh
- Bieu do: xu huong diem danh theo thoi gian

---

## Layout chung

```
┌──────────────────────────────────────────┐
│  Header: Logo | Ten user | Role | Logout │
├──────────┬───────────────────────────────┤
│          │                               │
│ Sidebar  │         Main Content          │
│          │                               │
│ - Dashboard                              │
│ - Quan ly NV                             │
│ - Diem danh                              │
│ - Bao cao                                │
│ - Admin                                  │
│          │                               │
└──────────┴───────────────────────────────┘
```

- Sidebar an/hien menu theo role
- Responsive: sidebar thu gon tren mobile

---

## Middleware bao ve route

```
/login              -> public
/dashboard          -> authenticated
/admin/*            -> role: admin
/employees/*        -> role: admin, manager, office_staff
/attendance         -> role: admin, manager, office_staff
/reports/*          -> role: admin, owner
/profile            -> authenticated
```
