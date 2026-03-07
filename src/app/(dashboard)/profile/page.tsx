"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
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

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", profile?.id);

    if (error) {
      setMessage("Loi khi cap nhat thong tin");
    } else {
      setMessage("Cap nhat thanh cong");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thong tin ca nhan</h1>
        <p className="mt-1 text-sm text-neutral-500">Xem va cap nhat thong tin cua ban</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ho so</CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
            </div>
            <Badge variant="secondary">{roleName || "N/A"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ho va ten</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhap ho va ten"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">So dien thoai</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhap so dien thoai"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
            </div>
            {message && (
              <p className={`text-sm ${message.includes("Loi") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Dang luu..." : "Luu thay doi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
