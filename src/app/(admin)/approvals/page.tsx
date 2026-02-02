import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, workSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ApprovalsPageClient } from "./approvals-client";

export default async function ApprovalsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const companyId = session.user.companyId;
  const userRole = session.user.role;
  const isManager = userRole === "manager";

  // 팀장인 경우 본인 부서 정보 조회
  let userDepartment: string | null = null;
  if (isManager) {
    const [currentUser] = await db
      .select({ department: users.department })
      .from(users)
      .where(eq(users.id, session.user.id));
    userDepartment = currentUser?.department || null;
  }

  // 승인 대기 세션 조회 (팀장은 본인 부서만)
  const conditions = [
    eq(workSessions.status, "submitted"),
    eq(users.companyId, companyId),
  ];
  if (isManager && userDepartment) {
    conditions.push(eq(users.department, userDepartment));
  }

  const pendingSessions = await db
    .select({
      id: workSessions.id,
      userName: users.name,
      department: users.department,
      date: workSessions.date,
      totalWorkSeconds: workSessions.totalWorkSeconds,
      submittedAt: workSessions.submittedAt,
    })
    .from(workSessions)
    .innerJoin(users, eq(workSessions.userId, users.id))
    .where(and(...conditions))
    .orderBy(workSessions.submittedAt);

  // 데이터 변환
  const sessionsForClient = pendingSessions.map((s) => ({
    id: s.id,
    userName: s.userName,
    department: s.department || "",
    date: s.date,
    totalWorkSeconds: s.totalWorkSeconds,
    submittedAt: s.submittedAt?.toISOString() || "",
  }));

  // 부서 목록 추출
  const departments = [...new Set(pendingSessions.map((s) => s.department).filter(Boolean))] as string[];

  return <ApprovalsPageClient sessions={sessionsForClient} departments={departments} />;
}
