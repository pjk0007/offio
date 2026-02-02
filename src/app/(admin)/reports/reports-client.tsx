"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Clock, Users, Home, Banknote, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

interface EmployeeReport {
  id: string;
  name: string;
  department: string;
  workDays: number;
  totalHours: number;
  averageHours: number;
  remoteDays: number;
}

interface SubsidyEmployee {
  id: string;
  name: string;
  department: string;
  remoteDays: number;
  monthlySubsidy: number;
  isEligible: boolean;
  reason?: string;
}

interface ReportsClientProps {
  plan: "lite" | "standard" | "enterprise";
  role: "admin" | "manager";
}

export function ReportsClient({ plan, role }: ReportsClientProps) {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [department, setDepartment] = useState("all");

  const isAdmin = role === "admin";
  // 지원금 증빙: Standard 이상 + Admin만 접근 가능
  const canUseSubsidyReport = plan !== "lite" && isAdmin;

  // 월간 리포트 데이터
  const mockSummary = {
    totalEmployees: 8,
    totalWorkDays: 22,
    averageWorkHours: 176,
    totalRemoteDays: 140,
  };

  const mockEmployees: EmployeeReport[] = [
    { id: "1", name: "홍길동", department: "개발팀", workDays: 22, totalHours: 176, averageHours: 8.0, remoteDays: 18 },
    { id: "2", name: "김철수", department: "디자인팀", workDays: 21, totalHours: 168, averageHours: 8.0, remoteDays: 17 },
    { id: "3", name: "이영희", department: "개발팀", workDays: 20, totalHours: 165, averageHours: 8.3, remoteDays: 16 },
    { id: "4", name: "박지민", department: "마케팅팀", workDays: 22, totalHours: 180, averageHours: 8.2, remoteDays: 20 },
    { id: "5", name: "최수진", department: "개발팀", workDays: 19, totalHours: 155, averageHours: 8.2, remoteDays: 15 },
    { id: "6", name: "정민호", department: "개발팀", workDays: 22, totalHours: 178, averageHours: 8.1, remoteDays: 19 },
    { id: "7", name: "강서연", department: "디자인팀", workDays: 20, totalHours: 162, averageHours: 8.1, remoteDays: 18 },
    { id: "8", name: "윤태준", department: "마케팅팀", workDays: 21, totalHours: 170, averageHours: 8.1, remoteDays: 17 },
  ];

  // 지원금 증빙 리포트 데이터
  const subsidyEmployees: SubsidyEmployee[] = mockEmployees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    department: emp.department,
    remoteDays: emp.remoteDays,
    monthlySubsidy: emp.remoteDays >= 12 ? 300000 : 0,
    isEligible: emp.remoteDays >= 12,
    reason: emp.remoteDays < 12 ? `재택근무 ${emp.remoteDays}일 (최소 12일 필요)` : undefined,
  }));

  const eligibleCount = subsidyEmployees.filter((e) => e.isEligible).length;
  const totalSubsidy = subsidyEmployees.reduce((sum, e) => sum + e.monthlySubsidy, 0);
  const estimatedAnnualSubsidy = totalSubsidy * 12;

  const filteredEmployees = mockEmployees.filter((emp) => {
    if (department !== "all" && emp.department !== department) {
      return false;
    }
    return true;
  });

  const handleExportMonthly = async () => {
    try {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

      const response = await fetch(
        `/api/reports/export?type=work-sessions&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `근무기록_${year}년${month}월.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("월간 리포트 엑셀 파일 다운로드가 완료되었습니다");
    } catch {
      toast.error("다운로드에 실패했습니다");
    }
  };

  const handleExportEmployees = async () => {
    try {
      const response = await fetch(`/api/reports/export?type=employees`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `직원목록_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("직원 목록 엑셀 파일 다운로드가 완료되었습니다");
    } catch {
      toast.error("다운로드에 실패했습니다");
    }
  };

  const handleExportVacations = async () => {
    try {
      const response = await fetch(`/api/reports/export?type=vacations`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `휴가내역_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("휴가 내역 엑셀 파일 다운로드가 완료되었습니다");
    } catch {
      toast.error("다운로드에 실패했습니다");
    }
  };

  const handleExportSubsidy = () => {
    toast.info("PDF 내보내기 기능은 준비 중입니다");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">리포트</h1>
        <p className="text-muted-foreground">근무 현황 및 지원금 증빙 리포트를 확인합니다</p>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly" className="gap-2">
            <FileText className="h-4 w-4" />
            월간 리포트
          </TabsTrigger>
          <TabsTrigger value="subsidy" className="gap-2" disabled={!canUseSubsidyReport}>
            <Banknote className="h-4 w-4" />
            지원금 증빙
            {!canUseSubsidyReport && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4 space-y-4">
          {/* 필터 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026년</SelectItem>
                      <SelectItem value="2025">2025년</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}월
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="부서" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="개발팀">개발팀</SelectItem>
                      <SelectItem value="디자인팀">디자인팀</SelectItem>
                      <SelectItem value="마케팅팀">마케팅팀</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExportMonthly}>
                  <Download className="mr-2 h-4 w-4" />
                  엑셀 다운로드
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 요약 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">총 인원</span>
                </div>
                <p className="text-2xl font-bold mt-1">{mockSummary.totalEmployees}명</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">총 근무일</span>
                </div>
                <p className="text-2xl font-bold mt-1">{mockSummary.totalWorkDays}일</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">평균 근무시간</span>
                </div>
                <p className="text-2xl font-bold mt-1">{mockSummary.averageWorkHours}시간</p>
                <p className="text-xs text-muted-foreground">1인당 월 평균</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">재택근무</span>
                </div>
                <p className="text-2xl font-bold mt-1">{mockSummary.totalRemoteDays}일</p>
                <p className="text-xs text-muted-foreground">전체 합계</p>
              </CardContent>
            </Card>
          </div>

          {/* 상세 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {year}년 {month}월 근무 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead className="text-right">근무일</TableHead>
                    <TableHead className="text-right">총시간</TableHead>
                    <TableHead className="text-right">평균</TableHead>
                    <TableHead className="text-right">재택근무</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell className="text-right">{employee.workDays}일</TableCell>
                      <TableCell className="text-right">{employee.totalHours}시간</TableCell>
                      <TableCell className="text-right">{employee.averageHours}h</TableCell>
                      <TableCell className="text-right">{employee.remoteDays}일</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Lite 플랜 업그레이드 안내 */}
          {!canUseSubsidyReport && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">지원금 증빙 리포트 기능</p>
                    <p className="mt-1 text-sm text-amber-800">
                      Standard 이상 요금제에서 정부 지원금 신청에 필요한 증빙 리포트를 자동으로 생성할 수 있습니다.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.info("요금제 변경은 설정에서 가능합니다")}>
                      요금제 업그레이드
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subsidy" className="mt-4 space-y-4">
          {/* 지원금 요약 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">대상 인원</span>
                </div>
                <p className="text-2xl font-bold mt-1">{eligibleCount}명</p>
                <p className="text-xs text-muted-foreground">/ {subsidyEmployees.length}명</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">이번 달 예상</span>
                </div>
                <p className="text-2xl font-bold mt-1">{(totalSubsidy / 10000).toLocaleString()}만원</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">연간 예상</span>
                </div>
                <p className="text-2xl font-bold mt-1">{(estimatedAnnualSubsidy / 10000).toLocaleString()}만원</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">인당 지원금</span>
                </div>
                <p className="text-2xl font-bold mt-1">30만원</p>
                <p className="text-xs text-muted-foreground">월 최대</p>
              </CardContent>
            </Card>
          </div>

          {/* 안내 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">유연근무제 장려금 안내</p>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>• 월 12일 이상 재택근무 시 인당 30만원 지원</li>
                    <li>• 피보험자의 30% 이내, 최대 70명까지 지원 가능</li>
                    <li>• 분기별 고용센터 신청 필요</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 증빙 리포트 다운로드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{year}년 {month}월 지원금 증빙 리포트</CardTitle>
                  <CardDescription>정부 제출용 양식으로 자동 생성됩니다</CardDescription>
                </div>
                <Button onClick={handleExportSubsidy}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF 다운로드
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead className="text-right">재택근무일</TableHead>
                    <TableHead className="text-right">예상 지원금</TableHead>
                    <TableHead>자격</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subsidyEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell className="text-right">{employee.remoteDays}일</TableCell>
                      <TableCell className="text-right">
                        {employee.monthlySubsidy > 0 ? `${(employee.monthlySubsidy / 10000)}만원` : "-"}
                      </TableCell>
                      <TableCell>
                        {employee.isEligible ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            대상
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-500">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            미달
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 제출 가이드 */}
          <Card>
            <CardHeader>
              <CardTitle>지원금 신청 가이드</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>위 PDF 리포트를 다운로드합니다</li>
                <li>고용보험 홈페이지에서 &apos;유연근무제 장려금&apos;을 신청합니다</li>
                <li>증빙자료로 다운로드한 PDF를 첨부합니다</li>
                <li>분기 종료 후 다음 분기 첫째 달 말일까지 신청해야 합니다</li>
              </ol>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => toast.info("고용보험 홈페이지로 이동합니다")}>
                  고용보험 홈페이지
                </Button>
                <Button variant="outline" onClick={() => toast.info("상세 가이드를 다운로드합니다")}>
                  상세 가이드 PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
