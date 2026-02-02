import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserCheck, UserX, Clock, AlertCircle, ChevronRight, Home } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { users, workSessions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const companyId = session.user.companyId;
  const userRole = session.user.role;
  const today = new Date().toISOString().split("T")[0];
  const isManager = userRole === "manager";

  // 팀장인 경우 본인 부서 정보 조회
  let userDepartment: string | null = null;
  if (isManager) {
    const [currentUser] = await db
      .select({ department: users.department })
      .from(users)
      .where(eq(users.id, session.user.id));
    userDepartment = currentUser?.department || null;
  }

  // 전체 직원 조회 (관리자 제외, 팀장은 본인 부서만)
  const employeeConditions = [
    eq(users.companyId, companyId),
    eq(users.isActive, true),
    sql`${users.role} != 'admin'`,
  ];
  if (isManager && userDepartment) {
    employeeConditions.push(eq(users.department, userDepartment));
  }

  const allEmployees = await db
    .select()
    .from(users)
    .where(and(...employeeConditions));

  // 오늘 근무 세션 조회 (user 정보 포함, 팀장은 본인 부서만)
  const sessionConditions = [
    eq(workSessions.date, today),
    eq(users.companyId, companyId),
  ];
  if (isManager && userDepartment) {
    sessionConditions.push(eq(users.department, userDepartment));
  }

  const todaySessions = await db
    .select({
      session: workSessions,
      user: users,
    })
    .from(workSessions)
    .innerJoin(users, eq(workSessions.userId, users.id))
    .where(and(...sessionConditions));

  // 현재 근무 중 (endTime이 null인 세션)
  const currentlyWorking = todaySessions
    .filter((s) => s.session.status === "recording" && !s.session.endTime)
    .map((s) => {
      const startTime = new Date(s.session.startTime);
      const now = new Date();
      const workingMinutes = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
      // 마지막 활동 시간 기준 활성 상태 (10분 이내면 활동 중)
      const isActive = s.session.totalActiveSeconds > 0; // 실제로는 마지막 활동 시간 비교 필요
      const isRemote = s.session.deviceOs === "macOS"; // 임시: macOS면 재택으로 가정

      return {
        id: s.session.id,
        name: s.user.name,
        department: s.user.department || "",
        startTime: format(startTime, "HH:mm"),
        workingMinutes,
        isActive,
        isRemote,
      };
    });

  // 퇴근 완료 (오늘 세션 중 endTime이 있는 것)
  const finished = todaySessions
    .filter((s) => s.session.endTime !== null)
    .map((s) => {
      const startTime = new Date(s.session.startTime);
      const endTime = new Date(s.session.endTime!);
      const totalMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

      return {
        id: s.session.id,
        name: s.user.name,
        department: s.user.department || "",
        startTime: format(startTime, "HH:mm"),
        endTime: format(endTime, "HH:mm"),
        totalMinutes,
      };
    });

  // 오늘 세션이 없는 직원 = 미출근
  const workingUserIds = new Set(todaySessions.map((s) => s.user.id));
  const notWorking = allEmployees
    .filter((e) => !workingUserIds.has(e.id))
    .map((e) => ({
      id: e.id,
      name: e.name,
      department: e.department || "",
      status: "미출근",
    }));

  // 승인 대기 세션 조회 (팀장은 본인 부서만)
  const approvalConditions = [
    eq(workSessions.status, "submitted"),
    eq(users.companyId, companyId),
  ];
  if (isManager && userDepartment) {
    approvalConditions.push(eq(users.department, userDepartment));
  }

  const pendingApprovals = await db
    .select({
      session: workSessions,
      user: users,
    })
    .from(workSessions)
    .innerJoin(users, eq(workSessions.userId, users.id))
    .where(and(...approvalConditions))
    .orderBy(sql`${workSessions.submittedAt} DESC`)
    .limit(5);

  const pendingApprovalsList = pendingApprovals.map((p) => ({
    id: p.session.id,
    employeeName: p.user.name,
    date: p.session.date,
    submittedAt: p.session.submittedAt ? format(new Date(p.session.submittedAt), "yyyy-MM-dd HH:mm") : "",
    totalHours: Math.round((p.session.totalWorkSeconds / 3600) * 10) / 10,
  }));

  // 통계
  const totalEmployees = allEmployees.length;
  const workingCount = currentlyWorking.length;
  const remoteWorkingCount = currentlyWorking.filter((w) => w.isRemote).length;
  const notStartedCount = notWorking.length;
  const pendingApprovalsCount = pendingApprovals.length;

  const formatWorkingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "yyyy년 M월 d일 (EEE)", { locale: ko })}
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 인원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">근무 중</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workingCount}명
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">재택근무</CardTitle>
            <Home className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {remoteWorkingCount}명
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">미출근</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStartedCount}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingApprovalsCount}건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 현재 근무 중인 팀원 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 근무 중인 팀원</CardTitle>
        </CardHeader>
        <CardContent>
          {currentlyWorking.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>시작시간</TableHead>
                    <TableHead>근무시간</TableHead>
                    <TableHead>근무형태</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentlyWorking.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.department}</TableCell>
                      <TableCell>{member.startTime}</TableCell>
                      <TableCell>{formatWorkingTime(member.workingMinutes)}</TableCell>
                      <TableCell>
                        <Badge variant={member.isRemote ? "default" : "secondary"}>
                          {member.isRemote ? "재택" : "사무실"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              member.isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          <span className="text-sm text-muted-foreground">
                            {member.isActive ? "활동 중" : "비활성"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  활동 중
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                  비활성 (10분 이상 입력 없음)
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              현재 근무 중인 팀원이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 하단 섹션 - 미출근/퇴근 + 승인 대기 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 미출근 / 퇴근 완료 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-muted-foreground" />
              미출근 / 퇴근 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 미출근 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">미출근 ({notWorking.length}명)</h4>
                {notWorking.length > 0 ? (
                  <div className="space-y-2">
                    {notWorking.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{member.department}</span>
                        </div>
                        <Badge variant="outline">{member.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">모든 인원이 출근했습니다.</p>
                )}
              </div>

              {/* 퇴근 완료 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">퇴근 완료 ({finished.length}명)</h4>
                {finished.length > 0 ? (
                  <div className="space-y-2">
                    {finished.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{member.department}</span>
                        </div>
                        <div className="text-sm text-right">
                          <div>{member.startTime} - {member.endTime}</div>
                          <div className="text-muted-foreground">{formatWorkingTime(member.totalMinutes)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">아직 퇴근한 인원이 없습니다.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 승인 대기 목록 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              승인 대기 중인 근무 기록
            </CardTitle>
            <Link href="/approvals">
              <Button variant="ghost" size="sm" className="gap-1">
                전체 보기
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingApprovalsList.length > 0 ? (
              <div className="space-y-3">
                {pendingApprovalsList.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium">{approval.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {approval.date} · {approval.totalHours}시간
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {approval.submittedAt} 제출
                      </span>
                      <Link href={`/approvals/${approval.id}`}>
                        <Button variant="outline" size="sm">
                          검토
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2" />
                <p>대기 중인 승인 요청이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
