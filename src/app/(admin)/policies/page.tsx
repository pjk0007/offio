import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, workPolicies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PoliciesClient } from "./policies-client";

export default async function PoliciesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const companyId = session.user.companyId;

  // 회사 정보 확인 (Enterprise only)
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));

  // Admin + Enterprise 전용
  if (!company || company.plan !== "enterprise" || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // 근무 정책 조회
  const [policy] = await db
    .select()
    .from(workPolicies)
    .where(eq(workPolicies.companyId, companyId));

  return (
    <PoliciesClient
      policy={policy || null}
      companyId={companyId}
    />
  );
}
