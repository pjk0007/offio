"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronRight, Search, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PendingSession {
  id: string;
  userName: string;
  department: string;
  date: string;
  totalWorkSeconds: number;
  submittedAt: string;
}

interface ApprovalsPageClientProps {
  sessions: PendingSession[];
  departments: string[];
}

export function ApprovalsPageClient({ sessions, departments }: ApprovalsPageClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${mins}분`;
  };

  const filteredSessions = sessions.filter((session) => {
    if (departmentFilter !== "all" && session.department !== departmentFilter) {
      return false;
    }
    if (startDate && session.date < startDate) {
      return false;
    }
    if (endDate && session.date > endDate) {
      return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSessions.map((s) => s.id));
    }
  };

  const handleBulkApprove = () => {
    toast.success(`${selectedIds.length}건의 근무 기록을 승인했습니다`);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">승인 관리</h1>
        <p className="text-muted-foreground">
          제출된 근무 기록을 검토하고 승인할 수 있습니다
        </p>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="부서" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>승인 대기 ({filteredSessions.length}건)</CardTitle>
          {selectedIds.length > 0 && (
            <Button onClick={handleBulkApprove}>
              <CheckCircle className="mr-2 h-4 w-4" />
              일괄 승인 ({selectedIds.length}건)
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedIds.length === filteredSessions.length &&
                        filteredSessions.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>근무시간</TableHead>
                  <TableHead>제출일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(session.id)}
                        onCheckedChange={() => toggleSelect(session.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{session.userName}</TableCell>
                    <TableCell>{session.department || "-"}</TableCell>
                    <TableCell>
                      {format(parseISO(session.date), "M/d (EEE)", { locale: ko })}
                    </TableCell>
                    <TableCell>{formatDuration(session.totalWorkSeconds)}</TableCell>
                    <TableCell>
                      {session.submittedAt
                        ? format(parseISO(session.submittedAt), "M/d HH:mm", { locale: ko })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/approvals/${session.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              승인 대기 중인 근무 기록이 없습니다.
            </div>
          )}

          {filteredSessions.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              선택: {selectedIds.length}건
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
