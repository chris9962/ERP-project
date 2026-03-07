"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Component Preview</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tat ca cac component co san trong he thong.
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Button</CardTitle>
          <CardDescription>Cac kieu button co san.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badge</CardTitle>
          <CardDescription>Hien thi trang thai va nhan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Loi</Badge>
          <Badge variant="success">Thanh cong</Badge>
          <Badge variant="warning">Canh bao</Badge>
        </CardContent>
      </Card>

      {/* Form elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form</CardTitle>
          <CardDescription>Input, Textarea, Checkbox, Switch.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ho va ten</Label>
            <Input id="name" placeholder="Nhap ho va ten..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chu</Label>
            <Textarea id="note" placeholder="Nhap ghi chu..." />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="agree" />
            <Label htmlFor="agree">Dong y dieu khoan</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="active" />
            <Label htmlFor="active">Kich hoat</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
          <CardDescription>Chuyen doi giua cac tab.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Nhan su</TabsTrigger>
              <TabsTrigger value="tab2">Kho hang</TabsTrigger>
              <TabsTrigger value="tab3">Ban hang</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4 text-sm text-neutral-600">
              Quan ly thong tin nhan vien, phong ban, luong.
            </TabsContent>
            <TabsContent value="tab2" className="mt-4 text-sm text-neutral-600">
              Quan ly san pham, ton kho, nhap xuat.
            </TabsContent>
            <TabsContent value="tab3" className="mt-4 text-sm text-neutral-600">
              Quan ly don hang, khach hang, doanh thu.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Separator />
      <p className="pb-4 text-xs text-neutral-400">ERP System v1.0.0</p>
    </div>
  );
}
