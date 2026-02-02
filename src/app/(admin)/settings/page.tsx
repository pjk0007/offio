import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin 전용 페이지
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyId;

  // 회사 정보 조회
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));

  if (!company) {
    redirect("/login");
  }

  // 회사 인원 수 조회
  const companyUsers = await db
    .select()
    .from(users)
    .where(eq(users.companyId, companyId));

  const userCount = companyUsers.length;

  return (
    <SettingsClient
      company={{
        name: company.name,
        logoUrl: company.logoUrl,
        plan: company.plan,
        screenshotInterval: company.screenshotInterval,
      }}
      userCount={userCount}
    />
  );
}
