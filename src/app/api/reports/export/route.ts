import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, workSessions, vacations } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import * as XLSX from "xlsx";

// GET: 리포트 Excel 내보내기
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdminOrManager = session.user.role === "admin" || session.user.role === "manager";
  if (!isAdminOrManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "work-sessions";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const companyId = session.user.companyId;
    const isManager = session.user.role === "manager";

    // 팀장인 경우 본인 부서 정보 조회
    let userDepartment: string | null = null;
    if (isManager) {
      const [currentUser] = await db
        .select({ department: users.department })
        .from(users)
        .where(eq(users.id, session.user.id));
      userDepartment = currentUser?.department || null;
    }

    let data: Record<string, unknown>[] = [];
    let sheetName = "Report";

    if (reportType === "work-sessions") {
      // 근무 기록 리포트
      sheetName = "근무기록";

      const sessionsWithUser = await db
        .select({
          userName: users.name,
          department: users.department,
          date: workSessions.date,
          startTime: workSessions.startTime,
          endTime: workSessions.endTime,
          totalWorkSeconds: workSessions.totalWorkSeconds,
          totalActiveSeconds: workSessions.totalActiveSeconds,
          status: workSessions.status,
        })
        .from(workSessions)
        .innerJoin(users, eq(workSessions.userId, users.id))
        .where(
          and(
            eq(users.companyId, companyId),
            isManager && userDepartment ? eq(users.department, userDepartment) : undefined,
            startDate ? gte(workSessions.date, startDate) : undefined,
            endDate ? lte(workSessions.date, endDate) : undefined
          )
        )
        .orderBy(desc(workSessions.date));

      data = sessionsWithUser.map((s) => ({
        이름: s.userName,
        부서: s.department || "-",
        날짜: s.date,
        출근시간: s.startTime ? new Date(s.startTime).toLocaleTimeString("ko-KR") : "-",
        퇴근시간: s.endTime ? new Date(s.endTime).toLocaleTimeString("ko-KR") : "-",
        총근무시간: formatDuration(s.totalWorkSeconds),
        활동시간: formatDuration(s.totalActiveSeconds),
        활동률: s.totalWorkSeconds > 0
          ? `${((s.totalActiveSeconds / s.totalWorkSeconds) * 100).toFixed(1)}%`
          : "-",
        상태: getStatusLabel(s.status),
      }));
    } else if (reportType === "vacations") {
      // 휴가 리포트
      sheetName = "휴가내역";

      const vacationsWithUser = await db
        .select({
          userName: users.name,
          department: users.department,
          type: vacations.type,
          startDate: vacations.startDate,
          endDate: vacations.endDate,
          days: vacations.days,
          reason: vacations.reason,
          status: vacations.status,
        })
        .from(vacations)
        .innerJoin(users, eq(vacations.userId, users.id))
        .where(
          and(
            eq(users.companyId, companyId),
            isManager && userDepartment ? eq(users.department, userDepartment) : undefined
          )
        )
        .orderBy(desc(vacations.createdAt));

      data = vacationsWithUser.map((v) => ({
        이름: v.userName,
        부서: v.department || "-",
        휴가종류: getVacationTypeLabel(v.type),
        시작일: v.startDate,
        종료일: v.endDate,
        일수: v.days,
        사유: v.reason || "-",
        상태: getVacationStatusLabel(v.status),
      }));
    } else if (reportType === "employees") {
      // 직원 리포트
      sheetName = "직원목록";

      const employees = await db
        .select({
          name: users.name,
          email: users.email,
          department: users.department,
          role: users.role,
          hireDate: users.hireDate,
          isActive: users.isActive,
        })
        .from(users)
        .where(
          and(
            eq(users.companyId, companyId),
            isManager && userDepartment ? eq(users.department, userDepartment) : undefined
          )
        )
        .orderBy(users.name);

      data = employees.map((e) => ({
        이름: e.name,
        이메일: e.email,
        부서: e.department || "-",
        직급: getRoleLabel(e.role),
        입사일: e.hireDate || "-",
        상태: e.isActive ? "활성" : "비활성",
      }));
    }

    // Excel 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 열 너비 자동 조정
    const columnWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length * 2, 15),
    }));
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Buffer로 변환
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // 파일명 생성
    const fileName = `${sheetName}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export report:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}시간 ${minutes}분`;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    recording: "기록중",
    editing: "수정중",
    submitted: "제출됨",
    approved: "승인됨",
    rejected: "반려됨",
  };
  return labels[status] || status;
}

function getVacationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    annual: "연차",
    half: "반차",
    sick: "병가",
    special: "경조사",
    other: "기타",
  };
  return labels[type] || type;
}

function getVacationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "대기중",
    approved: "승인",
    rejected: "반려",
  };
  return labels[status] || status;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "관리자",
    manager: "팀장",
    worker: "근무자",
  };
  return labels[role] || role;
}
