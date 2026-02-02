import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH: 사용자 정보 수정 (부서, 역할 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdminOrManager = session.user.role === "admin" || session.user.role === "manager";
  if (!isAdminOrManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const companyId = session.user.companyId;

    // 사용자 존재 및 같은 회사인지 확인
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.companyId, companyId)));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 팀장은 본인 부서원만 수정 가능
    if (session.user.role === "manager") {
      const [currentUser] = await db
        .select({ department: users.department })
        .from(users)
        .where(eq(users.id, session.user.id));

      if (currentUser?.department !== user.department) {
        return NextResponse.json({ error: "Can only modify users in your department" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { department, role, isActive, hireDate, annualLeaveBalance } = body;

    // role 변경은 admin만 가능
    if (role !== undefined && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admin can change roles" }, { status: 403 });
    }

    await db
      .update(users)
      .set({
        ...(department !== undefined && { department }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(hireDate !== undefined && { hireDate }),
        ...(annualLeaveBalance !== undefined && { annualLeaveBalance }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
