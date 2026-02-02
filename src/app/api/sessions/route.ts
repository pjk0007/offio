import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workSessions, users } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// GET: 세션 목록 조회
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 조건 배열
    const conditions = [];

    // 역할별 세션 조회 범위
    // - worker: 본인 세션만
    // - manager: 본인 세션만 (팀 관리는 별도 API)
    // - admin: 본인 회사 전체 세션
    if (session.user.role === "worker" || session.user.role === "manager") {
      conditions.push(eq(workSessions.userId, session.user.id));
    } else if (session.user.role === "admin") {
      // 같은 회사 사용자들의 세션만 조회
      conditions.push(eq(users.companyId, session.user.companyId));
    }

    // 상태 필터
    if (status && status !== "all") {
      conditions.push(eq(workSessions.status, status as "recording" | "editing" | "submitted" | "approved" | "rejected"));
    }

    // 날짜 필터
    if (startDate) {
      conditions.push(gte(workSessions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(workSessions.date, endDate));
    }

    const sessionsData = await db
      .select({
        id: workSessions.id,
        userId: workSessions.userId,
        date: workSessions.date,
        startTime: workSessions.startTime,
        endTime: workSessions.endTime,
        status: workSessions.status,
        totalWorkSeconds: workSessions.totalWorkSeconds,
        totalActiveSeconds: workSessions.totalActiveSeconds,
        userName: users.name,
        userDepartment: users.department,
      })
      .from(workSessions)
      .innerJoin(users, eq(workSessions.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workSessions.date), desc(workSessions.startTime))
      .limit(100);

    // 응답 형식 변환
    const sessions = sessionsData.map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      totalWorkSeconds: s.totalWorkSeconds,
      totalActiveSeconds: s.totalActiveSeconds,
      user: {
        id: s.userId,
        name: s.userName,
        department: s.userDepartment,
      },
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to get sessions:", error);
    return NextResponse.json(
      { error: "Failed to get sessions" },
      { status: 500 }
    );
  }
}
