"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronRight, Search } from "lucide-react";

type SessionStatus = "recording" | "editing" | "submitted" | "approved" | "rejected";

interface WorkSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  totalWorkSeconds: number;
  totalActiveSeconds: number;
  user: {
    id: string;
    name: string;
    department: string | null;
  };
}

const statusConfig = {
  recording: { label: "기록중", variant: "default" as const, className: "bg-blue-500" },
  editing: { label: "편집중", variant: "secondary" as const, className: "bg-yellow-500" },
  submitted: { label: "제출됨", variant: "outline" as const, className: "bg-orange-500" },
  approved: { label: "승인됨", variant: "default" as const, className: "bg-green-500" },
  rejected: { label: "반려됨", variant: "destructive" as const, className: "bg-red-500" },
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/sessions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");

      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSearch = () => {
    fetchSessions();
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "진행중";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${minutes.toString().padStart(2, "0")}분`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">근무 기록</h1>
        <p className="text-muted-foreground">근무 기록을 조회하고 편집할 수 있습니다</p>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="recording">기록중</SelectItem>
                <SelectItem value="editing">편집중</SelectItem>
                <SelectItem value="submitted">제출됨</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">반려됨</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>근무 기록 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              근무 기록이 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>근무시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {format(new Date(session.date), "M/d (EEE)", { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.startTime), "HH:mm")}
                      {session.endTime ? `~${format(new Date(session.endTime), "HH:mm")}` : "~"}
                    </TableCell>
                    <TableCell>{formatDuration(session.totalWorkSeconds)}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[session.status].variant}>
                        {statusConfig[session.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/sessions/${session.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
