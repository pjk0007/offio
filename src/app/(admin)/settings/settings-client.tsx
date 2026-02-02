"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CreditCard, Camera, Clock, Users, HardDrive, Check } from "lucide-react";
import { toast } from "sonner";

interface SettingsClientProps {
  company: {
    name: string;
    logoUrl: string | null;
    plan: "lite" | "standard" | "enterprise";
    screenshotInterval: number;
  };
  userCount: number;
}

const planInfo = {
  lite: {
    name: "Lite",
    price: "1.5만원",
    maxUsers: 10,
    screenshotRetention: 30,
    features: ["모니터링", "기록 편집/제출", "관리자 승인", "기본 리포트"],
  },
  standard: {
    name: "Standard",
    price: "2.5만원",
    maxUsers: "무제한",
    screenshotRetention: 90,
    features: ["모니터링", "기록 편집/제출", "관리자 승인", "기본 리포트", "지원금 증빙 리포트", "전담 지원"],
  },
  enterprise: {
    name: "Enterprise",
    price: "3.5만원",
    maxUsers: "무제한",
    screenshotRetention: 365,
    features: ["모니터링", "기록 편집/제출", "관리자 승인", "기본 리포트", "지원금 증빙 리포트", "전담 지원", "휴가 관리", "조직/부서 관리", "근무 정책 설정", "고급 통계/분석"],
  },
};

export function SettingsClient({ company, userCount }: SettingsClientProps) {
  const [companyName, setCompanyName] = useState(company.name);
  const [companyLogo, setCompanyLogo] = useState(company.logoUrl || "");
  const [screenshotInterval, setScreenshotInterval] = useState(company.screenshotInterval.toString());
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("18:00");

  const currentPlan = company.plan;
  const currentPlanInfo = planInfo[currentPlan];

  const handleSaveCompany = () => {
    toast.success("회사 정보가 저장되었습니다");
  };

  const handleSaveWorkSettings = () => {
    toast.success("근무 설정이 저장되었습니다");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">회사 및 서비스 설정을 관리합니다</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            회사 정보
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <CreditCard className="h-4 w-4" />
            요금제
          </TabsTrigger>
          <TabsTrigger value="work" className="gap-2">
            <Clock className="h-4 w-4" />
            근무 설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
              <CardDescription>회사 기본 정보를 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">회사명</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-logo">로고 URL</Label>
                <Input
                  id="company-logo"
                  placeholder="https://example.com/logo.png"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  권장 크기: 200x200px, PNG 또는 SVG
                </p>
              </div>
              <Button onClick={handleSaveCompany}>저장</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>사용량</CardTitle>
              <CardDescription>현재 서비스 사용 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">등록 인원</p>
                    <p className="text-2xl font-bold">{userCount}명</p>
                    <p className="text-xs text-muted-foreground">
                      / {currentPlanInfo.maxUsers === "무제한" ? "무제한" : `${currentPlanInfo.maxUsers}명`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  <HardDrive className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">스크린샷 저장</p>
                    <p className="text-2xl font-bold">12.5GB</p>
                    <p className="text-xs text-muted-foreground">이번 달 사용량</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  <Camera className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">스크린샷 보관</p>
                    <p className="text-2xl font-bold">{currentPlanInfo.screenshotRetention}일</p>
                    <p className="text-xs text-muted-foreground">자동 삭제</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                현재 요금제
                <Badge variant="default">{currentPlanInfo.name}</Badge>
              </CardTitle>
              <CardDescription>
                인당 월 {currentPlanInfo.price} · 스크린샷 {currentPlanInfo.screenshotRetention}일 보관
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">포함된 기능:</p>
                <ul className="grid gap-1">
                  {currentPlanInfo.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(planInfo).map(([key, plan]) => (
              <Card key={key} className={key === currentPlan ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {key === currentPlan && <Badge>현재</Badge>}
                  </CardTitle>
                  <CardDescription>
                    인당 월 {plan.price}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    <li>인원: {plan.maxUsers === "무제한" ? "무제한" : `${plan.maxUsers}명`}</li>
                    <li>스크린샷 보관: {plan.screenshotRetention}일</li>
                    <li>기능: {plan.features.length}개</li>
                  </ul>
                  {key !== currentPlan && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => toast.info("요금제 변경은 고객센터로 문의해주세요")}
                    >
                      {key === "enterprise" ? "업그레이드" : key === "lite" ? "다운그레이드" : "변경"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="work" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>스크린샷 설정</CardTitle>
              <CardDescription>스크린샷 캡처 간격을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>캡처 간격</Label>
                <Select value={screenshotInterval} onValueChange={setScreenshotInterval}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30초</SelectItem>
                    <SelectItem value="60">1분</SelectItem>
                    <SelectItem value="120">2분</SelectItem>
                    <SelectItem value="180">3분</SelectItem>
                    <SelectItem value="300">5분</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  짧은 간격일수록 더 상세한 기록이 가능하지만 저장 용량이 증가합니다
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>근무 시간 기본값</CardTitle>
              <CardDescription>기본 근무 시간을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="work-start">출근 시간</Label>
                  <Input
                    id="work-start"
                    type="time"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-end">퇴근 시간</Label>
                  <Input
                    id="work-end"
                    type="time"
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveWorkSettings}>저장</Button>
            </CardContent>
          </Card>

          {currentPlan === "enterprise" && (
            <Card>
              <CardHeader>
                <CardTitle>고급 근무 정책</CardTitle>
                <CardDescription>Enterprise 전용 기능</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>유연근무제 코어타임</Label>
                    <div className="flex items-center gap-2">
                      <Input type="time" defaultValue="10:00" className="w-32" />
                      <span>~</span>
                      <Input type="time" defaultValue="16:00" className="w-32" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>최소 근무시간 (일)</Label>
                    <Input type="number" defaultValue="8" className="w-32" />
                  </div>
                </div>
                <Button onClick={() => toast.success("근무 정책이 저장되었습니다")}>저장</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
