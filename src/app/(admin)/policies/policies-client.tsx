"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CalendarDays, Shield, Settings } from "lucide-react";
import { toast } from "sonner";

interface WorkPolicy {
  id: string;
  workStartTime: string;
  workEndTime: string;
  flexibleWorkEnabled: boolean;
  coreTimeStart: string | null;
  coreTimeEnd: string | null;
  minDailyHours: number;
  maxDailyHours: number;
  annualVacationDays: number;
  autoApproveEnabled: boolean;
}

interface PoliciesClientProps {
  policy: WorkPolicy | null;
  companyId: string;
}

export function PoliciesClient({ policy }: PoliciesClientProps) {
  const router = useRouter();

  // 기본 근무 시간
  const [workStartTime, setWorkStartTime] = useState(policy?.workStartTime || "09:00");
  const [workEndTime, setWorkEndTime] = useState(policy?.workEndTime || "18:00");

  // 유연근무제
  const [flexibleWorkEnabled, setFlexibleWorkEnabled] = useState(policy?.flexibleWorkEnabled || false);
  const [coreTimeStart, setCoreTimeStart] = useState(policy?.coreTimeStart || "10:00");
  const [coreTimeEnd, setCoreTimeEnd] = useState(policy?.coreTimeEnd || "16:00");

  // 근무시간 제한
  const [minDailyHours, setMinDailyHours] = useState(policy?.minDailyHours || 8);
  const [maxDailyHours, setMaxDailyHours] = useState(policy?.maxDailyHours || 12);

  // 휴가 정책
  const [annualVacationDays, setAnnualVacationDays] = useState(policy?.annualVacationDays || 15);

  // 자동 승인
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(policy?.autoApproveEnabled || false);

  // 로딩 상태
  const [isSaving, setIsSaving] = useState(false);

  const savePolicy = async (data: Partial<WorkPolicy>, successMessage: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save policy");
      }

      toast.success(successMessage);
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "정책 저장에 실패했습니다";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWorkHours = () => {
    savePolicy(
      { workStartTime, workEndTime, minDailyHours, maxDailyHours },
      "근무시간 설정이 저장되었습니다"
    );
  };

  const handleSaveFlexible = () => {
    savePolicy(
      { flexibleWorkEnabled, coreTimeStart, coreTimeEnd },
      "유연근무제 설정이 저장되었습니다"
    );
  };

  const handleSaveVacation = () => {
    savePolicy(
      { annualVacationDays },
      "휴가 정책이 저장되었습니다"
    );
  };

  const handleSaveApproval = () => {
    savePolicy(
      { autoApproveEnabled },
      "승인 정책이 저장되었습니다"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">근무정책</h1>
        <p className="text-muted-foreground">회사의 근무 정책을 설정합니다</p>
      </div>

      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            근무시간
          </TabsTrigger>
          <TabsTrigger value="flexible" className="gap-2">
            <Settings className="h-4 w-4" />
            유연근무제
          </TabsTrigger>
          <TabsTrigger value="vacation" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            휴가정책
          </TabsTrigger>
          <TabsTrigger value="approval" className="gap-2">
            <Shield className="h-4 w-4" />
            승인정책
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>기본 근무시간</CardTitle>
              <CardDescription>회사의 기본 근무 시간을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>출근 시간</Label>
                  <Input
                    type="time"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>퇴근 시간</Label>
                  <Input
                    type="time"
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>최소 일일 근무시간</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={minDailyHours}
                      onChange={(e) => setMinDailyHours(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">시간</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>최대 일일 근무시간</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={maxDailyHours}
                      onChange={(e) => setMaxDailyHours(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">시간</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveWorkHours} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flexible" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>유연근무제 설정</CardTitle>
              <CardDescription>유연근무제 사용 여부와 코어타임을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>유연근무제 활성화</Label>
                  <p className="text-sm text-muted-foreground">
                    코어타임 내 근무 시 출퇴근 시간을 자유롭게 조정할 수 있습니다
                  </p>
                </div>
                <Switch
                  checked={flexibleWorkEnabled}
                  onCheckedChange={setFlexibleWorkEnabled}
                />
              </div>

              {flexibleWorkEnabled && (
                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>코어타임 시작</Label>
                    <Input
                      type="time"
                      value={coreTimeStart}
                      onChange={(e) => setCoreTimeStart(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      이 시간까지는 반드시 출근해야 합니다
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>코어타임 종료</Label>
                    <Input
                      type="time"
                      value={coreTimeEnd}
                      onChange={(e) => setCoreTimeEnd(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      이 시간 이후부터 퇴근이 가능합니다
                    </p>
                  </div>
                </div>
              )}

              <Button onClick={handleSaveFlexible} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </CardContent>
          </Card>

          {flexibleWorkEnabled && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">유연근무제 안내</p>
                    <ul className="mt-2 text-sm text-blue-800 space-y-1">
                      <li>• 코어타임: {coreTimeStart} ~ {coreTimeEnd}</li>
                      <li>• 코어타임 내 필수 근무, 출퇴근 시간 자율</li>
                      <li>• 일일 최소 {minDailyHours}시간 근무 필요</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vacation" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>휴가 정책</CardTitle>
              <CardDescription>연차 및 휴가 관련 정책을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>연간 기본 연차</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={annualVacationDays}
                    onChange={(e) => setAnnualVacationDays(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">일</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  1년 이상 근무 직원에게 부여되는 기본 연차 일수입니다
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <p className="font-medium">연차 자동 계산 기준</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1년 미만: 월 1일 발생 (최대 11일)</li>
                  <li>• 1년 이상: 기본 {annualVacationDays}일</li>
                  <li>• 3년 이상: 2년마다 1일 추가 (최대 25일)</li>
                </ul>
              </div>

              <Button onClick={handleSaveVacation} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>승인 정책</CardTitle>
              <CardDescription>근무 기록 및 휴가 승인 관련 정책을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>근무 기록 자동 승인</Label>
                  <p className="text-sm text-muted-foreground">
                    제출된 근무 기록을 자동으로 승인합니다
                  </p>
                </div>
                <Switch
                  checked={autoApproveEnabled}
                  onCheckedChange={setAutoApproveEnabled}
                />
              </div>

              {autoApproveEnabled && (
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ 자동 승인이 활성화되면 제출된 모든 근무 기록이 즉시 승인됩니다.
                    지원금 증빙 시 문제가 될 수 있으니 신중하게 설정하세요.
                  </p>
                </div>
              )}

              <Button onClick={handleSaveApproval} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
