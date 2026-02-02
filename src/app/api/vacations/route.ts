import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vacations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// POST: 휴가 신청
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, startDate, endDate, days, reason, userId } = body;

    // 관리자/팀장이 다른 직원의 휴가를 대신 신청하는 경우
    const targetUserId = userId || session.user.id;
    const isAdminOrManager = session.user.role === "admin" || session.user.role === "manager";

    // 본인이 아닌 경우 관리자/팀장 권한 확인
    if (targetUserId !== session.user.id) {
      if (!isAdminOrManager) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // 팀장은 본인 부서원만 휴가 신청 가능
      if (session.user.role === "manager") {
        const [currentUser] = await db
          .select({ department: users.department })
          .from(users)
          .where(eq(users.id, session.user.id));

        const [targetUser] = await db
          .select({ department: users.department })
          .from(users)
          .where(eq(users.id, targetUserId));

        if (currentUser?.department !== targetUser?.department) {
          return NextResponse.json({ error: "Can only manage vacations for users in your department" }, { status: 403 });
        }
      }
    }

    const newVacation = {
      id: randomUUID(),
      userId: targetUserId,
      type: type as "annual" | "half" | "sick" | "special" | "other",
      startDate,
      endDate,
      days: Number(days),
      reason: reason || null,
      status: "pending" as const,
      rejectedReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(vacations).values(newVacation);

    return NextResponse.json({ success: true, vacation: newVacation });
  } catch (error) {
    console.error("Failed to create vacation:", error);
    return NextResponse.json({ error: "Failed to create vacation" }, { status: 500 });
  }
}
