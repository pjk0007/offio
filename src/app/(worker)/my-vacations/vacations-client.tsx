"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Plus, Check, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Vacation {
  id: string;
  type: "annual" | "half" | "sick" | "special" | "other";
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  rejectedReason: string | null;
  createdAt: Date;
}

interface AnnualInfo {
  total: number;
  used: number;
  remaining: number;
}

interface WorkerVacationsClientProps {
  vacations: Vacation[];
  annualInfo: AnnualInfo;
}

const vacationTypeLabels: Record<string, string> = {
  annual: "연차",
  half: "반차",
  sick: "병가",
  special: "경조사",
  other: "기타",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "대기중", variant: "secondary" },
  approved: { label: "승인", variant: "default" },
  rejected: { label: "반려", variant: "destructive" },
};

export function WorkerVacationsClient({ vacations, annualInfo }: WorkerVacationsClientProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vacationType, setVacationType] = useState<string>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelingVacationId, setCancelingVacationId] = useState<string | null>(null);

  const pendingCount = vacations.filter((v) => v.status === "pending").length;

  // 일수 계산
  const calculateDays = (start: string, end: string, type: string): number => {
    if (!start || !end) return 0;
    if (type === "half") return 0.5;
    const startD = new Date(start);
    const endD = new Date(end);
    const diffTime = endD.getTime() - startD.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast.error("날짜를 선택해주세요");
      return;
    }

    const days = calculateDays(startDate, endDate, vacationType);

    // 연차 잔여일 체크 (연차/반차인 경우)
    if ((vacationType === "annual" || vacationType === "half") && days > annualInfo.remaining) {
      toast.error(`연차가 부족합니다. 잔여 연차: ${annualInfo.remaining}일`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: vacationType,
          startDate,
          endDate,
          days,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create vacation");
      }

      toast.success("휴가가 신청되었습니다. 관리자 승인을 기다려주세요.");
      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("휴가 신청에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelVacation = async () => {
    if (!cancelingVacationId) return;

    try {
      const response = await fetch(`/api/vacations/${cancelingVacationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel vacation");
      }

      toast.success("휴가 신청이 취소되었습니다");
      setCancelingVacationId(null);
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "휴가 취소에 실패했습니다";
      toast.error(message);
    }
  };

  const resetForm = () => {
    setVacationType("annual");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">휴가관리</h1>
          <p className="text-muted-foreground">내 휴가를 신청하고 관리합니다</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              휴가 신청
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>휴가 신청</DialogTitle>
              <DialogDescription>휴가를 신청하면 관리자 승인 후 사용 가능합니다</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>휴가 종류</Label>
                <Select value={vacationType} onValueChange={setVacationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">연차</SelectItem>
                    <SelectItem value="half">반차</SelectItem>
                    <SelectItem value="sick">병가</SelectItem>
                    <SelectItem value="special">경조사</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작일</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>종료일</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              {startDate && endDate && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    신청 일수: <span className="font-medium">{calculateDays(startDate, endDate, vacationType)}일</span>
                  </p>
                  {(vacationType === "annual" || vacationType === "half") && (
                    <p className="text-sm text-muted-foreground">
                      잔여 연차: {annualInfo.remaining}일
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>사유</Label>
                <Textarea
                  placeholder="휴가 사유를 입력하세요 (선택)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "신청 중..." : "신청"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 휴가 취소 확인 Dialog */}
      <AlertDialog open={!!cancelingVacationId} onOpenChange={(open) => !open && setCancelingVacationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>휴가 신청 취소</AlertDialogTitle>
            <AlertDialogDescription>
              이 휴가 신청을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelVacation}>예, 취소합니다</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 연차 현황 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">총 연차</span>
            </div>
            <p className="text-2xl font-bold mt-1">{annualInfo.total}일</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">사용</span>
            </div>
            <p className="text-2xl font-bold mt-1">{annualInfo.used}일</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">잔여</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-primary">{annualInfo.remaining}일</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">승인 대기</span>
            </div>
            <p className="text-2xl font-bold mt-1">{pendingCount}건</p>
          </CardContent>
        </Card>
      </div>

      {/* 내 휴가 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>내 휴가 신청 내역</CardTitle>
          <CardDescription>신청한 휴가 목록입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종류</TableHead>
                <TableHead>기간</TableHead>
                <TableHead className="text-right">일수</TableHead>
                <TableHead>사유</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    휴가 신청 내역이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                vacations.map((vacation) => (
                  <TableRow key={vacation.id}>
                    <TableCell>{vacationTypeLabels[vacation.type]}</TableCell>
                    <TableCell>
                      {vacation.startDate} ~ {vacation.endDate}
                    </TableCell>
                    <TableCell className="text-right">{vacation.days}일</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {vacation.reason || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[vacation.status].variant}>
                        {statusLabels[vacation.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vacation.status === "rejected" && vacation.rejectedReason
                        ? vacation.rejectedReason
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {vacation.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancelingVacationId(vacation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
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
