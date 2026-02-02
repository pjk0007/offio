import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  workSessions,
  activityLogs,
  windowUsages,
  screenshots,
  users,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// GET: 세션 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 세션 조회
    const [workSession] = await db
      .select({
        id: workSessions.id,
        userId: workSessions.userId,
        date: workSessions.date,
        startTime: workSessions.startTime,
        endTime: workSessions.endTime,
        status: workSessions.status,
        totalWorkSeconds: workSessions.totalWorkSeconds,
        totalActiveSeconds: workSessions.totalActiveSeconds,
        deviceOs: workSessions.deviceOs,
        deviceHostname: workSessions.deviceHostname,
        memo: workSessions.memo,
        adminComment: workSessions.adminComment,
        submittedAt: workSessions.submittedAt,
        approvedAt: workSessions.approvedAt,
        createdAt: workSessions.createdAt,
        userName: users.name,
        userDepartment: users.department,
        userEmail: users.email,
      })
      .from(workSessions)
      .innerJoin(users, eq(workSessions.userId, users.id))
      .where(eq(workSessions.id, id));

    if (!workSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 권한 체크: 본인 세션이거나 관리자/매니저인 경우만 조회 가능
    const isOwner = workSession.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "manager";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 활동 로그 조회 (1분 단위)
    const activityLogsData = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.sessionId, id))
      .orderBy(activityLogs.startTime);

    // 활동 로그별 프로그램 사용량 집계
    const activityLogIds = activityLogsData.map((log) => log.id);

    let windowUsagesData: { activityLogId: number; programName: string; focusSeconds: number }[] = [];
    if (activityLogIds.length > 0) {
      windowUsagesData = await db
        .select({
          activityLogId: windowUsages.activityLogId,
          programName: windowUsages.programName,
          focusSeconds: windowUsages.focusSeconds,
        })
        .from(windowUsages)
        .where(inArray(windowUsages.activityLogId, activityLogIds));
    }

    // 프로그램별 총 사용 시간 집계
    const programUsageMap = new Map<string, number>();
    for (const usage of windowUsagesData) {
      const current = programUsageMap.get(usage.programName) || 0;
      programUsageMap.set(usage.programName, current + usage.focusSeconds);
    }

    const programUsage = Array.from(programUsageMap.entries())
      .map(([name, seconds]) => ({
        name,
        minutes: Math.round(seconds / 60),
        seconds,
      }))
      .sort((a, b) => b.seconds - a.seconds);

    // 시간대별 활동 데이터 (타임라인용)
    const timelineMap = new Map<number, {
      hour: number;
      activeMinutes: number;
      programs: { name: string; minutes: number }[];
      excluded: boolean;
      excludeReason: string | null;
    }>();

    for (const log of activityLogsData) {
      const hour = new Date(log.startTime).getHours();

      if (!timelineMap.has(hour)) {
        timelineMap.set(hour, {
          hour,
          activeMinutes: 0,
          programs: [],
          excluded: false,
          excludeReason: null,
        });
      }

      const slot = timelineMap.get(hour)!;

      if (log.isExcluded) {
        slot.excluded = true;
        slot.excludeReason = log.excludeReason;
      } else {
        // 활동 시간 계산 (actionCount > 0이면 활동 있음)
        if (log.actionCount > 0) {
          slot.activeMinutes += 1;
        }
      }
    }

    // 시간대별 프로그램 사용량 계산
    for (const log of activityLogsData) {
      if (log.isExcluded) continue;

      const hour = new Date(log.startTime).getHours();
      const slot = timelineMap.get(hour);
      if (!slot) continue;

      const logUsages = windowUsagesData.filter((u) => u.activityLogId === log.id);
      for (const usage of logUsages) {
        const existing = slot.programs.find((p) => p.name === usage.programName);
        if (existing) {
          existing.minutes += Math.round(usage.focusSeconds / 60);
        } else {
          slot.programs.push({
            name: usage.programName,
            minutes: Math.round(usage.focusSeconds / 60),
          });
        }
      }
    }

    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.hour - b.hour);

    // 스크린샷 조회
    const screenshotsData = await db
      .select({
        id: screenshots.id,
        capturedAt: screenshots.capturedAt,
        fileUrl: screenshots.fileUrl,
        isDeleted: screenshots.isDeleted,
      })
      .from(screenshots)
      .where(eq(screenshots.sessionId, id))
      .orderBy(screenshots.capturedAt);

    // 제외 시간 목록
    const excludedRanges = activityLogsData
      .filter((log) => log.isExcluded)
      .reduce((acc, log) => {
        const startTime = new Date(log.startTime);
        const endTime = new Date(log.endTime);
        const startStr = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;
        const endStr = `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`;

        // 연속된 제외 시간 병합
        const last = acc[acc.length - 1];
        if (last && last.endTime === startStr && last.reason === log.excludeReason) {
          last.endTime = endStr;
        } else {
          acc.push({
            id: String(log.id),
            startTime: startStr,
            endTime: endStr,
            reason: log.excludeReason || "제외됨",
          });
        }
        return acc;
      }, [] as { id: string; startTime: string; endTime: string; reason: string }[]);

    // 활동 데이터 포맷팅 (그래프용)
    const activityData = activityLogsData.map((log) => {
      const time = new Date(log.startTime);
      return {
        id: log.id,
        time: `${time.getHours()}:${String(time.getMinutes()).padStart(2, "0")}`,
        hour: time.getHours(),
        minute: time.getMinutes(),
        keyboardCount: log.keyboardCount,
        mouseClickCount: log.mouseClickCount,
        mouseDistance: log.mouseDistance,
        // 활성도 계산 (actionCount 기반, 최대 60초 중 비율)
        keyboardActiveSeconds: Math.min(60, Math.round(log.keyPressCount / 3)),
        mouseActiveSeconds: Math.min(60, Math.round(log.mouseClickCount * 3 + log.mouseDistance / 50)),
        totalActiveSeconds: log.actionCount > 0 ? Math.min(60, Math.round(log.actionCount / 1.5)) : 0,
        isExcluded: log.isExcluded,
      };
    });

    return NextResponse.json({
      session: {
        id: workSession.id,
        date: workSession.date,
        startTime: workSession.startTime,
        endTime: workSession.endTime,
        status: workSession.status,
        totalWorkSeconds: workSession.totalWorkSeconds,
        totalActiveSeconds: workSession.totalActiveSeconds,
        deviceOs: workSession.deviceOs,
        deviceHostname: workSession.deviceHostname,
        memo: workSession.memo,
        adminComment: workSession.adminComment,
        submittedAt: workSession.submittedAt,
        approvedAt: workSession.approvedAt,
        user: {
          id: workSession.userId,
          name: workSession.userName,
          department: workSession.userDepartment,
          email: workSession.userEmail,
        },
      },
      activityData,
      timeline,
      programUsage,
      screenshots: screenshotsData.map((s) => ({
        id: String(s.id),
        time: `${new Date(s.capturedAt).getHours()}:${String(new Date(s.capturedAt).getMinutes()).padStart(2, "0")}`,
        url: s.fileUrl,
        isDeleted: s.isDeleted,
      })),
      excludedRanges,
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

// PATCH: 세션 업데이트 (승인/반려, 메모 수정 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, memo, adminComment, rejectReason } = body;

    // 세션 조회
    const [workSession] = await db
      .select()
      .from(workSessions)
      .where(eq(workSessions.id, id));

    if (!workSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isOwner = workSession.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "manager";

    // 메모 수정 (본인만)
    if (memo !== undefined && isOwner) {
      await db
        .update(workSessions)
        .set({ memo, updatedAt: new Date() })
        .where(eq(workSessions.id, id));

      return NextResponse.json({ success: true });
    }

    // 승인/반려 (관리자만)
    if (action && isAdmin) {
      if (action === "approve") {
        await db
          .update(workSessions)
          .set({
            status: "approved",
            adminComment,
            approvedAt: new Date(),
            approvedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(workSessions.id, id));

        return NextResponse.json({ success: true, action: "approved" });
      }

      if (action === "reject") {
        await db
          .update(workSessions)
          .set({
            status: "rejected",
            adminComment: rejectReason || adminComment,
            updatedAt: new Date(),
          })
          .where(eq(workSessions.id, id));

        return NextResponse.json({ success: true, action: "rejected" });
      }

      if (action === "submit" && isOwner) {
        await db
          .update(workSessions)
          .set({
            status: "submitted",
            submittedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(workSessions.id, id));

        return NextResponse.json({ success: true, action: "submitted" });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
