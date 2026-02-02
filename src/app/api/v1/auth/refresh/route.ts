import { NextRequest, NextResponse } from "next/server";
import { refreshDesktopToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "리프레시 토큰이 필요합니다" } },
        { status: 400 }
      );
    }

    const tokens = await refreshDesktopToken(refreshToken);

    if (!tokens) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "유효하지 않은 토큰입니다" } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
