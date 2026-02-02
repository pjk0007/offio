"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Users, Clock, Activity, Building2, BarChart3 } from "lucide-react";

interface DepartmentStat {
  department: string;
  employeeCount: number;
  totalWorkHours: number;
  totalActiveHours: number;
}

interface EmployeeProductivity {
  id: string;
  name: string;
  department: string;
  totalWorkSeconds: number;
  totalActiveSeconds: number;
  sessionCount: number;
}

interface DailyWorkTrend {
  date: string;
  totalHours: number;
  activeHours: number;
  employeeCount: number;
}

interface AnalyticsClientProps {
  departmentStats: DepartmentStat[];
  employeeProductivity: EmployeeProductivity[];
  dailyWorkTrend: DailyWorkTrend[];
}

export function AnalyticsClient({
  departmentStats,
  employeeProductivity,
  dailyWorkTrend,
}: AnalyticsClientProps) {
  // 전체 통계 계산
  const totalWorkHours = departmentStats.reduce((sum, d) => sum + d.totalWorkHours, 0);
  const totalActiveHours = departmentStats.reduce((sum, d) => sum + d.totalActiveHours, 0);
  const overallActivityRate = totalWorkHours > 0 ? (totalActiveHours / totalWorkHours) * 100 : 0;
  const totalEmployees = departmentStats.reduce((sum, d) => sum + d.employeeCount, 0);

  // 부서별 활동률 계산
  const departmentWithRate = departmentStats.map((d) => ({
    ...d,
    activityRate: d.totalWorkHours > 0 ? (d.totalActiveHours / d.totalWorkHours) * 100 : 0,
    avgHoursPerEmployee: d.employeeCount > 0 ? d.totalWorkHours / d.employeeCount : 0,
  }));

  // 직원별 활동률 계산 및 정렬
  const employeeWithRate = employeeProductivity
    .map((e) => ({
      ...e,
      activityRate: e.totalWorkSeconds > 0 ? (e.totalActiveSeconds / e.totalWorkSeconds) * 100 : 0,
      totalHours: e.totalWorkSeconds / 3600,
    }))
    .sort((a, b) => b.activityRate - a.activityRate);

  // 최근 7일 추이
  const recentTrend = dailyWorkTrend.slice(-7);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">고급통계</h1>
        <p className="text-muted-foreground">상세한 근무 통계와 생산성 분석을 확인합니다</p>
      </div>

      {/* 전체 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">분석 대상</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalEmployees}명</p>
            <p className="text-xs text-muted-foreground">최근 30일 기준</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">총 근무시간</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalWorkHours.toFixed(0)}시간</p>
            <p className="text-xs text-muted-foreground">최근 30일 합계</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">활동 시간</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalActiveHours.toFixed(0)}시간</p>
            <p className="text-xs text-muted-foreground">활성 활동 합계</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">전체 활동률</span>
            </div>
            <p className="text-2xl font-bold mt-1">{overallActivityRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">활동/근무 비율</p>
          </CardContent>
        </Card>
      </div>

      {/* 부서별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            부서별 분석
          </CardTitle>
          <CardDescription>부서별 근무시간과 활동률을 비교합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>부서</TableHead>
                <TableHead className="text-right">인원</TableHead>
                <TableHead className="text-right">총 근무시간</TableHead>
                <TableHead className="text-right">1인당 평균</TableHead>
                <TableHead className="text-right">활동률</TableHead>
                <TableHead>수준</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentWithRate.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    데이터가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                departmentWithRate.map((dept) => (
                  <TableRow key={dept.department}>
                    <TableCell className="font-medium">{dept.department}</TableCell>
                    <TableCell className="text-right">{dept.employeeCount}명</TableCell>
                    <TableCell className="text-right">{dept.totalWorkHours.toFixed(1)}시간</TableCell>
                    <TableCell className="text-right">{dept.avgHoursPerEmployee.toFixed(1)}시간</TableCell>
                    <TableCell className="text-right">{dept.activityRate.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dept.activityRate >= 80
                            ? "default"
                            : dept.activityRate >= 60
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {dept.activityRate >= 80 ? "우수" : dept.activityRate >= 60 ? "보통" : "주의"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 일별 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            최근 7일 근무 추이
          </CardTitle>
          <CardDescription>일별 근무시간과 참여 인원을 확인합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrend.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">데이터가 없습니다</p>
            ) : (
              recentTrend.map((day) => {
                const dayActivityRate = day.totalHours > 0 ? (day.activeHours / day.totalHours) * 100 : 0;
                const maxHours = Math.max(...recentTrend.map((d) => d.totalHours), 1);
                const barWidth = (day.totalHours / maxHours) * 100;

                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day.date}</span>
                      <span className="text-muted-foreground">
                        {day.employeeCount}명 · {day.totalHours.toFixed(1)}시간 · 활동률 {dayActivityRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 직원별 생산성 순위 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            직원별 활동률 순위
          </CardTitle>
          <CardDescription>활동률 기준 상위 직원을 확인합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>순위</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead className="text-right">총 근무시간</TableHead>
                <TableHead className="text-right">출근일</TableHead>
                <TableHead className="text-right">활동률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeWithRate.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    데이터가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                employeeWithRate.slice(0, 10).map((emp, index) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell className="text-right">{emp.totalHours.toFixed(1)}시간</TableCell>
                    <TableCell className="text-right">{emp.sessionCount}일</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          emp.activityRate >= 80
                            ? "text-green-600 font-medium"
                            : emp.activityRate >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {emp.activityRate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
