"use client";

import { AdminSidebar } from "@/components/admin";
import { UploadProvider, UploadProgressPanel } from "@/components/admin/upload";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UploadProvider>
      <div className="min-h-screen bg-stone-100 flex">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
        <UploadProgressPanel />
      </div>
    </UploadProvider>
  );
}
