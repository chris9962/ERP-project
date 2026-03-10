"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingBars from "@/components/ui/loading-bars";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { HeaderActions } from "@/components/layout/header-actions";
import { toast } from "sonner";

type Role = { id: string; name: string; label: string | null; description: string | null };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/admin/roles", { credentials: "include" });
    if (res.ok) {
      setRoles(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  function openCreate() {
    setFormName("");
    setFormLabel("");
    setFormDesc("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);

    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, label: formLabel || null, description: formDesc || null }),
      credentials: "include",
    });

    setFormLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Lỗi khi tạo role");
      return;
    }

    toast.success("Đã tạo role mới");
    setDialogOpen(false);
    fetchRoles();
  }

  async function handleSaveEdit() {
    if (!editRole) return;
    setEditLoading(true);

    const res = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editRole.id,
        name: editRole.name,
        label: editLabel || null,
        description: editDesc || null,
      }),
      credentials: "include",
    });

    setEditLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Lỗi khi cập nhật");
      return;
    }

    toast.success("Đã cập nhật role");
    setEditRole(null);
    fetchRoles();
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Xóa role "${role.name}"?`)) return;

    const res = await fetch(`/api/admin/roles?id=${role.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Lỗi khi xóa role");
      return;
    }

    toast.success("Đã xóa role");
    fetchRoles();
  }

  return (
    <div className="space-y-6">
      <HeaderActions>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm role
        </Button>
      </HeaderActions>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm role mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên role</Label>
              <Input
                value={formName}
                onChange={(e) => {
                  const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_{2,}/g, "_").replace(/^_/, "");
                  setFormName(v);
                }}
                placeholder="vd: office_staff"
                required
                pattern="^[a-z][a-z0-9_]*$"
                title="Chỉ chữ thường, số và dấu _, bắt đầu bằng chữ"
              />
              <p className="text-xs text-neutral-400">Chỉ chữ thường, số và dấu gạch dưới (_)</p>
            </div>
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="vd: Văn phòng"
              />
              <p className="text-xs text-neutral-400">Tên tiếng Việt hiển thị cho người dùng</p>
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Mô tả vai trò..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Đang lưu..." : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa — {editRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="vd: Văn phòng"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Mô tả vai trò..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditRole(null)}>
                Hủy
              </Button>
              <Button onClick={handleSaveEdit} disabled={editLoading}>
                {editLoading ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên role</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8">
                  <div className="flex justify-center">
                    <LoadingBars message="Đang tải..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-neutral-400">
                  Chưa có role nào
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{role.name}</Badge>
                      {role.label && (
                        <span className="text-sm text-neutral-500">{role.label}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {role.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditRole(role); setEditLabel(role.label || ""); setEditDesc(role.description || ""); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(role)}
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
