"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, Clock, Monitor, Image as ImageIcon, Check, X, BarChart3 } from "lucide-react";
import { toast } from "sonner";

import {
  ActivitySummaryCards,
  ActivityGraphs,
  ExcludedRangesCard,
  TimelineTab,
  ScreenshotsTab,
  ProgramsTab,
  formatDuration,
  type ActivityData,
  type TimelineSlot,
  type Screenshot,
  type ExcludedRange,
  type ProgramUsage,
  type SessionData,
  type TimeInterval,
} from "@/components/session";

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();

  // API 데이터 상태
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [timeline, setTimeline] = useState<TimelineSlot[]>([]);
  const [programUsage, setProgramUsage] = useState<ProgramUsage[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [excludedRanges, setExcludedRanges] = useState<ExcludedRange[]>([]);

  // UI 상태
  const [comment, setComment] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [timeInterval, setTimeInterval] = useState<TimeInterval>("5");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 데이터 로딩
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/sessions/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch session");
        }
        const data = await response.json();

        setSessionData(data.session);
        setActivityData(data.activityData || []);
        setTimeline(data.timeline || []);
        setProgramUsage(data.programUsage || []);
        setScreenshots(data.screenshots || []);
        setExcludedRanges(data.excludedRanges || []);
        setComment(data.session.adminComment || "");
      } catch (error) {
        console.error("Failed to fetch session:", error);
        toast.error("세션 데이터를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchSessionData();
    }
  }, [params.id]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/sessions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", adminComment: comment }),
      });

      if (!response.ok) throw new Error("Failed to approve");

      toast.success("근무 기록을 승인했습니다");
      router.push("/approvals");
    } catch {
      toast.error("승인에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("반려 사유를 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/sessions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectReason }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      toast.success("근무 기록을 반려했습니다");
      setShowRejectDialog(false);
      router.push("/approvals");
    } catch {
      toast.error("반려에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">세션 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">세션을 찾을 수 없습니다</p>
          <Button onClick={() => router.back()}>돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {sessionData.user.name} -{" "}
            {format(new Date(sessionData.date), "yyyy년 M월 d일 (EEE)", { locale: ko })}
          </h1>
          <p className="text-muted-foreground">
            {sessionData.user.department} · 제출:{" "}
            {sessionData.submittedAt
              ? format(new Date(sessionData.submittedAt), "M/d HH:mm", { locale: ko })
              : "-"}
          </p>
        </div>
      </div>

      {/* 요약 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">출근</p>
              <p className="text-xl font-bold">
                {format(new Date(sessionData.startTime), "HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">퇴근</p>
              <p className="text-xl font-bold">
                {sessionData.endTime
                  ? format(new Date(sessionData.endTime), "HH:mm")
                  : "--:--"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 근무시간</p>
              <p className="text-xl font-bold">{formatDuration(sessionData.totalWorkSeconds)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">활동 시간</p>
              <p className="text-xl font-bold">{formatDuration(sessionData.totalActiveSeconds)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            활동 그래프
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            타임라인
          </TabsTrigger>
          <TabsTrigger value="screenshots" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            스크린샷
          </TabsTrigger>
          <TabsTrigger value="programs" className="gap-2">
            <Monitor className="h-4 w-4" />
            프로그램
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4 space-y-4">
          <ExcludedRangesCard excludedRanges={excludedRanges} />
          <ActivitySummaryCards activityData={activityData} />
          <ActivityGraphs
            activityData={activityData}
            timeInterval={timeInterval}
            onTimeIntervalChange={setTimeInterval}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab timeline={timeline} />
        </TabsContent>

        <TabsContent value="screenshots" className="mt-4">
          <ScreenshotsTab screenshots={screenshots} />
        </TabsContent>

        <TabsContent value="programs" className="mt-4">
          <ProgramsTab programUsage={programUsage} timeline={timeline} detailed />
        </TabsContent>
      </Tabs>

      {/* 근무자 메모 */}
      {sessionData.memo && (
        <Card>
          <CardHeader>
            <CardTitle>근무자 메모</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{sessionData.memo}</p>
          </CardContent>
        </Card>
      )}

      {/* 관리자 코멘트 & 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>관리자 코멘트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="코멘트를 입력하세요 (선택)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              반려
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              <Check className="mr-2 h-4 w-4" />
              {isSubmitting ? "처리 중..." : "승인"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 반려 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반려 사유 입력</DialogTitle>
            <DialogDescription>근무자에게 전달될 반려 사유를 입력해주세요</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="반려 사유를 입력하세요"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
