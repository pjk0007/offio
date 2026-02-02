import { NextRequest, NextResponse } from "next/server";
import { db, workSessions, activityLogs } from "@/db";
import { eq, and, sum } from "drizzle-orm";
import { verifyDesktopToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "인증이 필요합니다" } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyDesktopToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "유효하지 않은 토큰입니다" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    // 세션 조회
    const session = await db.query.workSessions.findFirst({
      where: and(
        eq(workSessions.id, sessionId),
        eq(workSessions.userId, payload.userId)
      ),
    });

    if (!session) {
      return NextResponse.json(
        { error: { code: "SESSION_NOT_FOUND", message: "세션을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    if (session.status !== "recording") {
      return NextResponse.json(
        { error: { code: "INVALID_STATUS", message: "진행 중인 세션이 아닙니다" } },
        { status: 400 }
      );
    }

    const now = new Date();

    // 총 활동 시간 계산
    const activityResult = await db
      .select({
        totalActive: sum(activityLogs.durationSeconds),
      })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.sessionId, sessionId),
          eq(activityLogs.isExcluded, false)
        )
      );

    const totalActiveSeconds = Number(activityResult[0]?.totalActive) || 0;
    const totalWorkSeconds = Math.floor(
      (now.getTime() - new Date(session.startTime).getTime()) / 1000
    );

    // 세션 업데이트
    const [updatedSession] = await db
      .update(workSessions)
      .set({
        endTime: now,
        status: "editing",
        totalWorkSeconds,
        totalActiveSeconds,
        updatedAt: now,
      })
      .where(eq(workSessions.id, sessionId))
      .returning();

    return NextResponse.json({
      sessionId: updatedSession.id,
      endTime: updatedSession.endTime,
      totalWorkSeconds: updatedSession.totalWorkSeconds,
      totalActiveSeconds: updatedSession.totalActiveSeconds,
    });
  } catch (error) {
    console.error("Session end error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
