import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, vacations, users, workPolicies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { WorkerVacationsClient } from "./vacations-client";
import { calculateUsedAnnualLeave, calculateRemainingAnnualLeave } from "@/lib/annual-leave";

export default async function WorkerVacationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const companyId = session.user.companyId;

  // 회사 정보 확인 (Enterprise only)
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));

  if (!company || company.plan !== "enterprise") {
    redirect("/home");
  }

  // 사용자 정보 조회 (입사일, 연차 잔액)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  // 회사 근무 정책 조회 (기본 연차 일수)
  const [policy] = await db
    .select()
    .from(workPolicies)
    .where(eq(workPolicies.companyId, companyId));

  // 내 휴가 목록 조회
  const myVacations = await db
    .select()
    .from(vacations)
    .where(eq(vacations.userId, userId))
    .orderBy(desc(vacations.createdAt));

  // 사용한 연차 계산
  const usedDays = calculateUsedAnnualLeave(myVacations);

  // 연차 정보 계산
  const annualInfo = calculateRemainingAnnualLeave({
    hireDate: user?.hireDate,
    baseAnnualDays: policy?.annualVacationDays || 15,
    manualBalance: user?.annualLeaveBalance,
    usedDays,
  });

  return (
    <WorkerVacationsClient
      vacations={myVacations}
      annualInfo={{
        total: annualInfo.total,
        used: annualInfo.used,
        remaining: annualInfo.remaining,
      }}
    />
  );
}
