"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, Clock, Monitor, Image as ImageIcon, Send, BarChart3 } from "lucide-react";
import { toast } from "sonner";

import {
  ActivitySummaryCards,
  ActivityGraphs,
  ExcludedRangesCard,
  TimelineTab,
  ScreenshotsTab,
  ProgramsTab,
  formatDuration,
  calculateAverageActivity,
  type ActivityData,
  type TimelineSlot,
  type Screenshot,
  type ExcludedRange,
  type ProgramUsage,
  type SessionData,
  type TimeInterval,
} from "@/components/session";

export default function SessionDetailPage() {
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
  const [memo, setMemo] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedScreenshots, setSelectedScreenshots] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddExcludeModal, setShowAddExcludeModal] = useState(false);
  const [newExcludeStartTime, setNewExcludeStartTime] = useState("");
  const [newExcludeEndTime, setNewExcludeEndTime] = useState("");
  const [newExcludeReason, setNewExcludeReason] = useState("");
  const [timeInterval, setTimeInterval] = useState<TimeInterval>("5");

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
        setMemo(data.session.memo || "");
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

  const deletedScreenshotCount = screenshots.filter((s) => s.isDeleted).length;

  // 제외된 시간 계산 (분 단위)
  const totalExcludedMinutes = excludedRanges.reduce((acc, range) => {
    const [startH, startM] = range.startTime.split(":").map(Number);
    const [endH, endM] = range.endTime.split(":").map(Number);
    return acc + (endH * 60 + endM - (startH * 60 + startM));
  }, 0);

  // 평균 활성도 계산 (미리보기용)
  const avgTotalActivity = calculateAverageActivity(activityData, "totalActiveSeconds");

  const handleSubmit = () => {
    toast.success("근무 기록이 제출되었습니다");
    setShowPreview(false);
    router.push("/sessions");
  };

  // 스크린샷 처리
  const handleToggleScreenshot = (id: string) => {
    setSelectedScreenshots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllScreenshots = () => {
    const nonDeletedIds = screenshots.filter((s) => !s.isDeleted).map((s) => s.id);
    if (selectedScreenshots.size === nonDeletedIds.length) {
      setSelectedScreenshots(new Set());
    } else {
      setSelectedScreenshots(new Set(nonDeletedIds));
    }
  };

  const handleDeleteScreenshots = () => {
    setScreenshots((prev) =>
      prev.map((s) => (selectedScreenshots.has(s.id) ? { ...s, isDeleted: true } : s))
    );
    toast.success(`${selectedScreenshots.size}개의 스크린샷이 삭제되었습니다`);
    setSelectedScreenshots(new Set());
    setShowDeleteConfirm(false);
  };

  const handleRestoreScreenshot = (id: string) => {
    setScreenshots((prev) => prev.map((s) => (s.id === id ? { ...s, isDeleted: false } : s)));
    toast.success("스크린샷이 복원되었습니다");
  };

  // 제외 시간 추가
  const handleAddExcludedRange = () => {
    if (!newExcludeStartTime || !newExcludeEndTime || !newExcludeReason) return;

    setExcludedRanges((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        startTime: newExcludeStartTime,
        endTime: newExcludeEndTime,
        reason: newExcludeReason,
      },
    ]);
    toast.success("제외 시간이 추가되었습니다");
    setShowAddExcludeModal(false);
    setNewExcludeStartTime("");
    setNewExcludeEndTime("");
    setNewExcludeReason("");
  };

  const handleRemoveExcludedRange = (id: string) => {
    setExcludedRanges((prev) => prev.filter((r) => r.id !== id));
    toast.success("제외 시간이 삭제되었습니다");
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
            {format(new Date(sessionData.date), "yyyy년 M월 d일 (EEE)", { locale: ko })} 근무 기록
          </h1>
          <p className="text-muted-foreground">근무 기록을 확인하고 편집할 수 있습니다</p>
        </div>
      </div>

      {/* 요약 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
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
              <p className="text-sm text-muted-foreground">제외 시간</p>
              <p className="text-xl font-bold text-orange-500">{totalExcludedMinutes}분</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">실 근무시간</p>
              <p className="text-xl font-bold text-primary">
                {formatDuration(sessionData.totalActiveSeconds)}
              </p>
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
          <ExcludedRangesCard
            excludedRanges={excludedRanges}
            editable
            onAdd={() => setShowAddExcludeModal(true)}
            onRemove={handleRemoveExcludedRange}
          />
          <ActivitySummaryCards activityData={activityData} />
          <ActivityGraphs
            activityData={activityData}
            timeInterval={timeInterval}
            onTimeIntervalChange={setTimeInterval}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab timeline={timeline} excludedRanges={excludedRanges} editable />
        </TabsContent>

        <TabsContent value="screenshots" className="mt-4">
          <ScreenshotsTab
            screenshots={screenshots}
            editable
            selectedScreenshots={selectedScreenshots}
            onToggleScreenshot={handleToggleScreenshot}
            onSelectAll={handleSelectAllScreenshots}
            onDeleteSelected={() => setShowDeleteConfirm(true)}
            onRestoreScreenshot={handleRestoreScreenshot}
          />
        </TabsContent>

        <TabsContent value="programs" className="mt-4">
          <ProgramsTab programUsage={programUsage} timeline={timeline} />
        </TabsContent>
      </Tabs>

      {/* 메모 & 제출 */}
      <Card>
        <CardHeader>
          <CardTitle>메모</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="특이사항을 입력하세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              미리보기
            </Button>
            <Button onClick={() => setShowPreview(true)}>
              <Send className="mr-2 h-4 w-4" />
              제출하기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 제출 미리보기 다이얼로그 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>제출 미리보기</DialogTitle>
            <DialogDescription>아래 내용이 관리자에게 전달됩니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">날짜</span>
                <span className="font-medium">
                  {format(new Date(sessionData.date), "yyyy년 M월 d일 (EEE)", { locale: ko })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">근무 시간</span>
                <span className="font-medium">
                  {format(new Date(sessionData.startTime), "HH:mm")} ~{" "}
                  {sessionData.endTime
                    ? format(new Date(sessionData.endTime), "HH:mm")
                    : "--:--"}{" "}
                  ({formatDuration(sessionData.totalWorkSeconds)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">제외 시간</span>
                <span className="font-medium">
                  {excludedRanges.length > 0
                    ? excludedRanges
                        .map((r) => `${r.startTime}~${r.endTime} (${r.reason})`)
                        .join(", ")
                    : "없음"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">실 근무시간</span>
                <span className="font-medium">
                  {formatDuration(sessionData.totalActiveSeconds)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">평균 활성도</span>
                <span className="font-medium">{avgTotalActivity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">스크린샷</span>
                <span className="font-medium">
                  {screenshots.length}장{" "}
                  {deletedScreenshotCount > 0 && `(삭제: ${deletedScreenshotCount}장)`}
                </span>
              </div>
              {memo && (
                <div>
                  <span className="text-muted-foreground">메모</span>
                  <p className="mt-1">{memo}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              수정하기
            </Button>
            <Button onClick={handleSubmit}>제출</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 제외 시간 추가 모달 */}
      <Dialog open={showAddExcludeModal} onOpenChange={setShowAddExcludeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>제외 시간 추가</DialogTitle>
            <DialogDescription>근무 기록에서 제외할 시간대를 입력하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">시작 시간</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newExcludeStartTime}
                  onChange={(e) => setNewExcludeStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">종료 시간</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newExcludeEndTime}
                  onChange={(e) => setNewExcludeEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exclude-reason">제외 사유</Label>
              <Select value={newExcludeReason} onValueChange={setNewExcludeReason}>
                <SelectTrigger>
                  <SelectValue placeholder="사유를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="점심시간">점심시간</SelectItem>
                  <SelectItem value="휴식">휴식</SelectItem>
                  <SelectItem value="외출">외출</SelectItem>
                  <SelectItem value="개인용무">개인용무</SelectItem>
                  <SelectItem value="회의">회의 (오프라인)</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExcludeModal(false)}>
              취소
            </Button>
            <Button
              onClick={handleAddExcludedRange}
              disabled={!newExcludeStartTime || !newExcludeEndTime || !newExcludeReason}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 스크린샷 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>스크린샷 삭제</DialogTitle>
            <DialogDescription>선택한 스크린샷을 삭제하시겠습니까?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {selectedScreenshots.size}개의 스크린샷이 선택되었습니다. 삭제된 스크린샷은
              관리자에게 전송되지 않습니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteScreenshots}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
