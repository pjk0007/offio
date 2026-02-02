import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, users, workSessions, activityLogs } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
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

  // 최근 30일 기준
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  // 부서별 통계
  const departmentStats = await db
    .select({
      department: users.department,
      employeeCount: sql<number>`count(distinct ${users.id})`,
      totalWorkHours: sql<number>`sum(${workSessions.totalWorkSeconds}) / 3600`,
      totalActiveHours: sql<number>`sum(${workSessions.totalActiveSeconds}) / 3600`,
    })
    .from(users)
    .leftJoin(workSessions, eq(users.id, workSessions.userId))
    .where(
      and(
        eq(users.companyId, companyId),
        gte(workSessions.date, thirtyDaysAgoStr)
      )
    )
    .groupBy(users.department);

  // 직원별 생산성 (활동률)
  const employeeProductivity = await db
    .select({
      id: users.id,
      name: users.name,
      department: users.department,
      totalWorkSeconds: sql<number>`sum(${workSessions.totalWorkSeconds})`,
      totalActiveSeconds: sql<number>`sum(${workSessions.totalActiveSeconds})`,
      sessionCount: sql<number>`count(${workSessions.id})`,
    })
    .from(users)
    .leftJoin(workSessions, eq(users.id, workSessions.userId))
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.isActive, true),
        gte(workSessions.date, thirtyDaysAgoStr)
      )
    )
    .groupBy(users.id, users.name, users.department);

  // 일별 근무시간 추이
  const dailyWorkTrend = await db
    .select({
      date: workSessions.date,
      totalHours: sql<number>`sum(${workSessions.totalWorkSeconds}) / 3600`,
      activeHours: sql<number>`sum(${workSessions.totalActiveSeconds}) / 3600`,
      employeeCount: sql<number>`count(distinct ${workSessions.userId})`,
    })
    .from(workSessions)
    .innerJoin(users, eq(workSessions.userId, users.id))
    .where(
      and(
        eq(users.companyId, companyId),
        gte(workSessions.date, thirtyDaysAgoStr)
      )
    )
    .groupBy(workSessions.date)
    .orderBy(workSessions.date);

  return (
    <AnalyticsClient
      departmentStats={departmentStats.map((d) => ({
        department: d.department || "미지정",
        employeeCount: Number(d.employeeCount) || 0,
        totalWorkHours: Number(d.totalWorkHours) || 0,
        totalActiveHours: Number(d.totalActiveHours) || 0,
      }))}
      employeeProductivity={employeeProductivity.map((e) => ({
        id: e.id,
        name: e.name,
        department: e.department || "미지정",
        totalWorkSeconds: Number(e.totalWorkSeconds) || 0,
        totalActiveSeconds: Number(e.totalActiveSeconds) || 0,
        sessionCount: Number(e.sessionCount) || 0,
      }))}
      dailyWorkTrend={dailyWorkTrend.map((d) => ({
        date: d.date,
        totalHours: Number(d.totalHours) || 0,
        activeHours: Number(d.activeHours) || 0,
        employeeCount: Number(d.employeeCount) || 0,
      }))}
    />
  );
}
