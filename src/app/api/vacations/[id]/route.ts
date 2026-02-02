import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vacations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH: 휴가 승인/반려
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin" || session.user.role === "manager";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, rejectedReason } = body;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 휴가 존재 확인
    const [vacation] = await db
      .select()
      .from(vacations)
      .where(eq(vacations.id, id));

    if (!vacation) {
      return NextResponse.json({ error: "Vacation not found" }, { status: 404 });
    }

    // 같은 회사 직원의 휴가인지 확인
    const [vacationUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, vacation.userId));

    if (!vacationUser || vacationUser.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 상태 업데이트
    await db
      .update(vacations)
      .set({
        status,
        rejectedReason: status === "rejected" ? rejectedReason : null,
        updatedAt: new Date(),
      })
      .where(eq(vacations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update vacation:", error);
    return NextResponse.json({ error: "Failed to update vacation" }, { status: 500 });
  }
}

// DELETE: 휴가 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 휴가 존재 확인
    const [vacation] = await db
      .select()
      .from(vacations)
      .where(eq(vacations.id, id));

    if (!vacation) {
      return NextResponse.json({ error: "Vacation not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin" || session.user.role === "manager";
    const isOwner = vacation.userId === session.user.id;

    // 본인 또는 관리자만 삭제 가능
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 이미 승인된 휴가는 관리자만 삭제 가능
    if (vacation.status === "approved" && !isAdmin) {
      return NextResponse.json({ error: "Cannot cancel approved vacation" }, { status: 400 });
    }

    await db.delete(vacations).where(eq(vacations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete vacation:", error);
    return NextResponse.json({ error: "Failed to delete vacation" }, { status: 500 });
  }
}
