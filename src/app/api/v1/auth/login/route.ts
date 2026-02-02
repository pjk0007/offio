import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { compare } from "bcrypt";
import { createDesktopToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "이메일과 비밀번호를 입력하세요" } },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: { company: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다" } },
        { status: 401 }
      );
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다" } },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken } = await createDesktopToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
