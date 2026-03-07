"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Department = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    const res = await fetch("/api/departments", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setDepartments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setFormName(dept.name);
    setFormDesc(dept.description || "");
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    if (!formName.trim()) {
      setFormError("Ten phong ban khong duoc de trong");
      setFormLoading(false);
      return;
    }

    if (editing) {
      const res = await fetch(`/api/departments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc || null }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError("Loi: " + (data.error ?? res.statusText));
        setFormLoading(false);
        return;
      }
    } else {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc || null }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError("Loi: " + (data.error ?? res.statusText));
        setFormLoading(false);
        return;
      }
    }

    setFormLoading(false);
    setDialogOpen(false);
    fetchDepartments();
  }

  async function deleteDept(dept: Department) {
    if (!confirm(`Xoa phong ban "${dept.name}"?`)) return;
    await fetch(`/api/departments/${dept.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchDepartments();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Phong ban</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Quan ly danh sach phong ban
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Them phong ban
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Chinh sua phong ban" : "Them phong ban moi"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Ten phong ban</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nhap ten phong ban"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mo ta</Label>
                <Textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mo ta phong ban"
                  rows={3}
                />
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
                  Huy
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Dang xu ly..." : editing ? "Cap nhat" : "Tao"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ten phong ban</TableHead>
              <TableHead>Mo ta</TableHead>
              <TableHead>Ngay tao</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-neutral-400">
                  Dang tai...
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-neutral-400">
                  Chua co phong ban nao
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-neutral-500">
                    {dept.description || "—"}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {new Date(dept.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(dept)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => deleteDept(dept)}
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
