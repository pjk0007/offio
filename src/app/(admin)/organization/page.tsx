import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, departments, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { OrganizationClient } from "./organization-client";

export default async function OrganizationPage() {
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

  // Admin 전용 + Standard 이상 (Lite는 부서 없음)
  if (!company || company.plan === "lite" || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const isEnterprise = company.plan === "enterprise";

  // 부서 목록 조회
  const departmentList = await db
    .select()
    .from(departments)
    .where(eq(departments.companyId, companyId));

  // 직원 목록 조회
  const employeeList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      department: users.department,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.companyId, companyId));

  return (
    <OrganizationClient
      departments={departmentList}
      employees={employeeList}
      isEnterprise={isEnterprise}
    />
  );
}
