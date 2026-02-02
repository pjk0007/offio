import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileCheck, Timer } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default async function WorkerDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const today = new Date();

  // TODO: 실제 데이터로 교체
  const mockData = {
    currentSession: {
      isWorking: true,
      startTime: new Date(today.setHours(9, 0, 0)),
      elapsedMinutes: 392,
    },
    weeklyHours: 32.5,
    monthlyHours: 128,
    pendingSubmissions: 3,
    recentSessions: [
      {
        id: "1",
        date: new Date(2026, 0, 28),
        startTime: "09:00",
        endTime: "18:30",
        duration: "8시간 30분",
        status: "editing" as const,
      },
      {
        id: "2",
        date: new Date(2026, 0, 27),
        startTime: "09:15",
        endTime: "18:00",
        duration: "7시간 45분",
        status: "approved" as const,
      },
      {
        id: "3",
        date: new Date(2026, 0, 24),
        startTime: "09:00",
        endTime: "17:30",
        duration: "7시간 30분",
        status: "approved" as const,
      },
    ],
  };

  const statusBadge = {
    recording: { label: "기록중", variant: "default" as const },
    editing: { label: "편집중", variant: "secondary" as const },
    submitted: { label: "제출됨", variant: "outline" as const },
    approved: { label: "승인됨", variant: "default" as const },
    rejected: { label: "반려됨", variant: "destructive" as const },
  };

  const formatElapsedTime = (minutes: number) => {
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

      {/* 오늘의 근무 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            오늘의 근무
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockData.currentSession.isWorking ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {format(mockData.currentSession.startTime, "HH:mm")} 시작
                </span>
                <Badge>근무 중</Badge>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-muted">
                  <div
                    className="h-3 rounded-full bg-primary"
                    style={{
                      width: `${Math.min((mockData.currentSession.elapsedMinutes / 480) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-right text-2xl font-bold">
                  {formatElapsedTime(mockData.currentSession.elapsedMinutes)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              오늘 근무 기록이 없습니다
            </p>
          )}
        </CardContent>
      </Card>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 주</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.weeklyHours}시간</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 달</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.monthlyHours}시간</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">제출 대기</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockData.pendingSubmissions}건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 근무 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 근무 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData.recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {format(session.date, "M/d (EEE)", { locale: ko })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.startTime}~{session.endTime} ({session.duration})
                  </p>
                </div>
                <Badge variant={statusBadge[session.status].variant}>
                  {statusBadge[session.status].label}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
