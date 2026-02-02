import { NextRequest, NextResponse } from "next/server";
import { db, workSessions, users, companies } from "@/db";
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
    const { deviceInfo } = body;

    // 이미 진행 중인 세션이 있는지 확인
    const existingSession = await db.query.workSessions.findFirst({
      where: and(
        eq(workSessions.userId, payload.userId),
        eq(workSessions.status, "recording")
      ),
    });

    if (existingSession) {
      return NextResponse.json(
        { error: { code: "SESSION_ALREADY_STARTED", message: "이미 근무 중입니다" } },
        { status: 400 }
      );
    }

    // 회사 정보 조회 (스크린샷 간격)
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      with: { company: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // 새 세션 생성
    const [newSession] = await db
      .insert(workSessions)
      .values({
        userId: payload.userId,
        date: today,
        startTime: now,
        status: "recording",
        deviceOs: deviceInfo?.os,
        deviceHostname: deviceInfo?.hostname,
        deviceIp: deviceInfo?.ip,
      })
      .returning();

    return NextResponse.json({
      sessionId: newSession.id,
      startTime: newSession.startTime,
      screenshotInterval: user.company.screenshotInterval,
    });
  } catch (error) {
    console.error("Session start error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
