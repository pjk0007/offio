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
import { CalendarDays, Plus, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

interface Vacation {
  id: string;
  userId: string;
  userName: string;
  department: string | null;
  type: "annual" | "half" | "sick" | "special" | "other";
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

interface Employee {
  id: string;
  name: string;
  department: string | null;
}

interface VacationsClientProps {
  vacations: Vacation[];
  employees: Employee[];
  isAdmin: boolean;
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

export function VacationsClient({ vacations, employees, isAdmin }: VacationsClientProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingVacationId, setRejectingVacationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [vacationType, setVacationType] = useState<string>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredVacations = vacations.filter((v) => {
    if (statusFilter === "all") return true;
    return v.status === statusFilter;
  });

  const pendingCount = vacations.filter((v) => v.status === "pending").length;

  // 일수 계산
  const calculateDays = (start: string, end: string, type: string): number => {
    if (!start || !end) return 0;
    if (type === "half") return 0.5;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !startDate || !endDate) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const days = calculateDays(startDate, endDate, vacationType);
      const response = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedEmployee,
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

      toast.success("휴가가 신청되었습니다");
      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error("휴가 신청에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/vacations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve vacation");
      }

      toast.success("휴가가 승인되었습니다");
      router.refresh();
    } catch (error) {
      toast.error("휴가 승인에 실패했습니다");
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectingVacationId(id);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingVacationId) return;

    try {
      const response = await fetch(`/api/vacations/${rejectingVacationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectedReason: rejectReason }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject vacation");
      }

      toast.success("휴가가 반려되었습니다");
      setIsRejectDialogOpen(false);
      setRejectingVacationId(null);
      router.refresh();
    } catch (error) {
      toast.error("휴가 반려에 실패했습니다");
    }
  };

  const resetForm = () => {
    setSelectedEmployee("");
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
          <p className="text-muted-foreground">직원들의 휴가를 관리합니다</p>
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
              <DialogDescription>새로운 휴가를 신청합니다</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>직원</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="직원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department || "미지정"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <p className="text-sm text-muted-foreground">
                  총 {calculateDays(startDate, endDate, vacationType)}일
                </p>
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

      {/* 반려 사유 입력 Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>휴가 반려</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="반려 사유를 입력하세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">전체 신청</span>
            </div>
            <p className="text-2xl font-bold mt-1">{vacations.length}건</p>
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">승인됨</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {vacations.filter((v) => v.status === "approved").length}건
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">반려됨</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {vacations.filter((v) => v.status === "rejected").length}건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 휴가 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>휴가 목록</CardTitle>
              <CardDescription>신청된 휴가 내역입니다</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="approved">승인</SelectItem>
                <SelectItem value="rejected">반려</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>종류</TableHead>
                <TableHead>기간</TableHead>
                <TableHead className="text-right">일수</TableHead>
                <TableHead>사유</TableHead>
                <TableHead>상태</TableHead>
                {isAdmin && <TableHead className="text-right">작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVacations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground py-8">
                    휴가 신청 내역이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredVacations.map((vacation) => (
                  <TableRow key={vacation.id}>
                    <TableCell className="font-medium">{vacation.userName}</TableCell>
                    <TableCell>{vacation.department || "-"}</TableCell>
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
                    {isAdmin && (
                      <TableCell className="text-right">
                        {vacation.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(vacation.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRejectDialog(vacation.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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
