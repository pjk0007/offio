import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // 일반 근무자는 근무자 대시보드로 리다이렉트
  if (session.user.role === "worker") {
    redirect("/home");
  }

  // 회사 정보 조회
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, session.user.companyId));

  return (
    <SidebarProvider>
      <AppSidebar
        role={session.user.role as "admin" | "manager" | "worker"}
        userName={session.user.name || ""}
        companyName={session.user.companyName || ""}
        plan={company?.plan}
      />
      <SidebarInset>
        <AppHeader userName={session.user.name || ""} role={session.user.role as "admin" | "manager" | "worker"} />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
