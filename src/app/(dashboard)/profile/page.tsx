"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { profile, roleName } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone }),
      credentials: "include",
    });
    if (!res.ok) {
      setMessage("Lỗi khi cập nhật thông tin");
    } else {
      setMessage("Cập nhật thành công");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thông tin cá nhân</h1>
        <p className="mt-1 text-sm text-neutral-500">Xem và cập nhật thông tin của bạn</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hồ sơ</CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
            </div>
            <Badge variant="secondary">{roleName || "N/A"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
            </div>
            {message && (
              <p className={`text-sm ${message.includes("Lỗi") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
