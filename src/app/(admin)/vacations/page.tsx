import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, vacations, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { VacationsClient } from "./vacations-client";

export default async function VacationsPage() {
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

  if (!company || company.plan !== "enterprise") {
    redirect("/dashboard");
  }

  // 휴가 목록 조회
  const vacationList = await db
    .select({
      vacation: vacations,
      user: {
        id: users.id,
        name: users.name,
        department: users.department,
      },
    })
    .from(vacations)
    .innerJoin(users, eq(vacations.userId, users.id))
    .where(eq(users.companyId, companyId))
    .orderBy(desc(vacations.createdAt));

  // 직원 목록 (휴가 신청 시 선택용)
  const employees = await db
    .select({
      id: users.id,
      name: users.name,
      department: users.department,
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.isActive, true)));

  return (
    <VacationsClient
      vacations={vacationList.map((v) => ({
        ...v.vacation,
        userName: v.user.name,
        department: v.user.department,
      }))}
      employees={employees}
      isAdmin={session.user.role === "admin" || session.user.role === "manager"}
    />
  );
}
