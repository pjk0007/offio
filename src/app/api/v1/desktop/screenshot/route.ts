import { NextRequest, NextResponse } from "next/server";
import { db, screenshots, workSessions } from "@/db";
import { eq, and } from "drizzle-orm";
import { verifyDesktopToken } from "@/lib/jwt";
import { getUploadPresignedUrl, generateScreenshotKey, getPublicUrl } from "@/lib/r2";

// Presigned URL 발급 (업로드 전)
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
    const { sessionId, capturedAt, contentType = "image/png" } = body;

    // 세션 검증
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

    const timestamp = new Date(capturedAt);
    const key = generateScreenshotKey(
      payload.companyId,
      payload.userId,
      sessionId,
      timestamp
    );

    const uploadUrl = await getUploadPresignedUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Screenshot presign error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}

// 업로드 완료 후 메타데이터 저장
export async function PUT(request: NextRequest) {
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
    const { sessionId, capturedAt, fileUrl, fileSize, activityLogId } = body;

    // 세션 검증
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

    // 스크린샷 메타데이터 저장
    const [screenshot] = await db
      .insert(screenshots)
      .values({
        sessionId,
        activityLogId: activityLogId || null,
        capturedAt: new Date(capturedAt),
        fileUrl,
        fileSize,
      })
      .returning();

    return NextResponse.json({
      screenshotId: screenshot.id,
      fileUrl: screenshot.fileUrl,
    });
  } catch (error) {
    console.error("Screenshot save error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
