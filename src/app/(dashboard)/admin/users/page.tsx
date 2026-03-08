"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingBars from "@/components/ui/loading-bars";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { HeaderActions } from "@/components/layout/header-actions";

type Role = { id: string; name: string; description: string | null };
type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  role_id: string | null;
  roles: { name: string } | null;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  }, []);

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/admin/roles?group=admin", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setRoles(data);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  function openCreate() {
    setEditingUser(null);
    setFormEmail("");
    setFormPassword("");
    setFormName("");
    setFormPhone("");
    setFormRoleId("");
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(user: UserProfile) {
    setEditingUser(user);
    setFormEmail(user.email || "");
    setFormPassword("");
    setFormName(user.full_name || "");
    setFormPhone(user.phone || "");
    setFormRoleId(user.role_id || "");
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    if (editingUser) {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          full_name: formName,
          phone: formPhone,
          role_id: formRoleId || null,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError("Lỗi khi cập nhật: " + (data.error ?? res.statusText));
        setFormLoading(false);
        return;
      }
    } else {
      // Create new user via edge function or admin API
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          full_name: formName,
          phone: formPhone,
          role_id: formRoleId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Lỗi khi tạo user");
        setFormLoading(false);
        return;
      }
    }

    setFormLoading(false);
    setDialogOpen(false);
    fetchUsers();
  }

  async function toggleActive(user: UserProfile) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        action: "toggleActive",
        is_active: !user.is_active,
      }),
      credentials: "include",
    });
    fetchUsers();
  }

  async function deleteUser(user: UserProfile) {
    if (!confirm(`Xóa user "${user.full_name || user.email}"?`)) return;

    await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    fetchUsers();
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <HeaderActions>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm user
        </Button>
      </HeaderActions>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Chỉnh sửa user" : "Thêm user mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mật khẩu</Label>
                    <Input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRoleId} onValueChange={setFormRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading
                    ? "Đang xử lý..."
                    : editingUser
                      ? "Cập nhật"
                      : "Tạo user"}
                </Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Tìm kiếm user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <div className="flex justify-center">
                    <LoadingBars message="Đang tải..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-neutral-400">
                  Không có user nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || "—"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {(user.roles as { name: string } | null)?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => toggleActive(user)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => deleteUser(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
