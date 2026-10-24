import type { Metadata } from "next";
import Sidebar from "./sidebar";

export const metadata: Metadata = {
  title: "后台管理 · 克里斯蒂小姐侦探所",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-10 py-10">{children}</div>
      </main>
    </div>
  );
}
