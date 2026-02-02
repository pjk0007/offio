"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ko } from "date-fns/locale";

export default function StatsPage() {
  const [tab, setTab] = useState("weekly");

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // TODO: 실제 데이터로 교체
  const mockWeeklyData = {
    totalHours: 42.5,
    averageHours: 8.5,
    remoteDays: 5,
    dailyHours: [8.5, 8.0, 9.0, 8.5, 8.5, 0, 0],
    topPrograms: [
      { name: "VS Code", hours: 18.5, percentage: 44 },
      { name: "Chrome", hours: 10.2, percentage: 24 },
      { name: "Slack", hours: 5.5, percentage: 13 },
      { name: "Figma", hours: 4.3, percentage: 10 },
      { name: "기타", hours: 4.0, percentage: 9 },
    ],
  };

  const mockMonthlyData = {
    totalDays: 22,
    totalHours: 176,
    averageHours: 8,
    remoteDays: 18,
  };

  const maxHours = Math.max(...mockWeeklyData.dailyHours, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="text-muted-foreground">근무 현황을 확인할 수 있습니다</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="weekly">주간</TabsTrigger>
          <TabsTrigger value="monthly">월간</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4 space-y-6">
          {/* 주간 요약 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">총 근무시간</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockWeeklyData.totalHours}시간</div>
                <p className="text-xs text-muted-foreground">
                  {format(weekStart, "M/d", { locale: ko })} ~{" "}
                  {format(weekEnd, "M/d", { locale: ko })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">평균 근무시간</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockWeeklyData.averageHours}시간</div>
                <p className="text-xs text-muted-foreground">일 평균</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">재택근무</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockWeeklyData.remoteDays}일</div>
                <p className="text-xs text-muted-foreground">이번 주</p>
              </CardContent>
            </Card>
          </div>

          {/* 일별 근무시간 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>일별 근무시간</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-48">
                {weekDays.map((day, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className={`w-full rounded-t ${
                          mockWeeklyData.dailyHours[index] > 0
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                        style={{
                          height: `${
                            (mockWeeklyData.dailyHours[index] / maxHours) * 100
                          }%`,
                          minHeight: mockWeeklyData.dailyHours[index] > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {format(day, "EEE", { locale: ko })}
                      </p>
                      <p className="text-sm font-medium">
                        {mockWeeklyData.dailyHours[index] || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 프로그램 사용량 */}
          <Card>
            <CardHeader>
              <CardTitle>프로그램 사용 TOP 5</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWeeklyData.topPrograms.map((program) => (
                  <div key={program.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{program.name}</span>
                      <span className="text-muted-foreground">
                        {program.hours}시간 ({program.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${program.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-6">
          {/* 월간 요약 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">총 근무일</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMonthlyData.totalDays}일</div>
                <p className="text-xs text-muted-foreground">
                  {format(today, "yyyy년 M월", { locale: ko })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">총 근무시간</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMonthlyData.totalHours}시간</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">평균 근무시간</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMonthlyData.averageHours}시간</div>
                <p className="text-xs text-muted-foreground">일 평균</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">재택근무</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMonthlyData.remoteDays}일</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-12">
                월간 상세 차트는 준비 중입니다
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
