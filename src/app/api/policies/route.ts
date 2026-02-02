import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workPolicies, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET: 근무 정책 조회
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const companyId = session.user.companyId;

    const [policy] = await db
      .select()
      .from(workPolicies)
      .where(eq(workPolicies.companyId, companyId));

    return NextResponse.json({ policy: policy || null });
  } catch (error) {
    console.error("Failed to get policy:", error);
    return NextResponse.json({ error: "Failed to get policy" }, { status: 500 });
  }
}

// POST: 근무 정책 생성 또는 수정
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Only admin can modify policies" }, { status: 403 });
  }

  try {
    const companyId = session.user.companyId;

    // Enterprise 플랜 확인
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));

    if (!company || company.plan !== "enterprise") {
      return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      workStartTime,
      workEndTime,
      flexibleWorkEnabled,
      coreTimeStart,
      coreTimeEnd,
      minDailyHours,
      maxDailyHours,
      annualVacationDays,
      autoApproveEnabled,
    } = body;

    // 기존 정책 확인
    const [existingPolicy] = await db
      .select()
      .from(workPolicies)
      .where(eq(workPolicies.companyId, companyId));

    if (existingPolicy) {
      // 업데이트
      await db
        .update(workPolicies)
        .set({
          ...(workStartTime !== undefined && { workStartTime }),
          ...(workEndTime !== undefined && { workEndTime }),
          ...(flexibleWorkEnabled !== undefined && { flexibleWorkEnabled }),
          ...(coreTimeStart !== undefined && { coreTimeStart }),
          ...(coreTimeEnd !== undefined && { coreTimeEnd }),
          ...(minDailyHours !== undefined && { minDailyHours }),
          ...(maxDailyHours !== undefined && { maxDailyHours }),
          ...(annualVacationDays !== undefined && { annualVacationDays }),
          ...(autoApproveEnabled !== undefined && { autoApproveEnabled }),
          updatedAt: new Date(),
        })
        .where(eq(workPolicies.id, existingPolicy.id));

      return NextResponse.json({ success: true, updated: true });
    } else {
      // 새로 생성
      const newPolicy = {
        id: randomUUID(),
        companyId,
        workStartTime: workStartTime || "09:00",
        workEndTime: workEndTime || "18:00",
        flexibleWorkEnabled: flexibleWorkEnabled || false,
        coreTimeStart: coreTimeStart || "10:00",
        coreTimeEnd: coreTimeEnd || "16:00",
        minDailyHours: minDailyHours || 8,
        maxDailyHours: maxDailyHours || 12,
        annualVacationDays: annualVacationDays || 15,
        autoApproveEnabled: autoApproveEnabled || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(workPolicies).values(newPolicy);

      return NextResponse.json({ success: true, created: true });
    }
  } catch (error) {
    console.error("Failed to save policy:", error);
    return NextResponse.json({ error: "Failed to save policy" }, { status: 500 });
  }
}
