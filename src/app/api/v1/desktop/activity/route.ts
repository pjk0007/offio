import { NextRequest, NextResponse } from "next/server";
import { db, activityLogs, windowUsages, workSessions } from "@/db";
import { eq, and } from "drizzle-orm";
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
    const {
      sessionId,
      startTime,
      endTime,
      durationSeconds,
      keyboardCount,
      keyPressCount,
      mouseClickCount,
      mouseDistance,
      actionCount,
      windows,
    } = body;

    // 세션 검증
    const session = await db.query.workSessions.findFirst({
      where: and(
        eq(workSessions.id, sessionId),
        eq(workSessions.userId, payload.userId),
        eq(workSessions.status, "recording")
      ),
    });

    if (!session) {
      return NextResponse.json(
        { error: { code: "SESSION_NOT_FOUND", message: "진행 중인 세션을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // 활동 로그 저장
    const [activityLog] = await db
      .insert(activityLogs)
      .values({
        sessionId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationSeconds: durationSeconds || 10,
        keyboardCount: keyboardCount || 0,
        keyPressCount: keyPressCount || 0,
        mouseClickCount: mouseClickCount || 0,
        mouseDistance: mouseDistance || 0,
        actionCount: actionCount || 0,
      })
      .returning();

    // 윈도우 사용량 저장
    if (windows && windows.length > 0) {
      await db.insert(windowUsages).values(
        windows.map((w: { name: string; focusSeconds: number }) => ({
          activityLogId: activityLog.id,
          programName: w.name,
          focusSeconds: w.focusSeconds,
        }))
      );
    }

    return NextResponse.json({
      activityLogId: activityLog.id,
    });
  } catch (error) {
    console.error("Activity log error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
