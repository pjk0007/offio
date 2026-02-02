"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Mail, Users, UserCheck, UserX, Search } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: "admin" | "manager" | "worker";
  isActive: boolean;
}

const roleLabels = {
  admin: "관리자",
  manager: "팀장",
  worker: "근무자",
};

interface TeamPageClientProps {
  members: TeamMember[];
  plan: "lite" | "standard" | "enterprise";
}

export function TeamPageClient({ members, plan }: TeamPageClientProps) {
  const isLite = plan === "lite";
  const hasDepartments = !isLite; // standard, enterprise는 부서 있음
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [newMember, setNewMember] = useState<{
    email: string;
    name: string;
    department: string;
    role: "admin" | "manager" | "worker";
  }>({
    email: "",
    name: "",
    department: "",
    role: "worker",
  });

  const handleAddMember = () => {
    if (!newMember.email || !newMember.name) {
      toast.error("이메일과 이름을 입력해주세요");
      return;
    }
    toast.success(`${newMember.name}님을 추가했습니다. 초대 메일이 발송됩니다.`);
    setIsAddDialogOpen(false);
    setNewMember({ email: "", name: "", department: "", role: "worker" });
  };

  const handleDeactivate = (member: TeamMember) => {
    toast.success(`${member.name}님을 비활성화했습니다`);
  };

  // 필터링된 멤버
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.includes(searchQuery) || member.email.includes(searchQuery);
    const matchesDepartment = filterDepartment === "all" || member.department === filterDepartment;
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  // 통계
  const activeCount = members.filter((m) => m.isActive).length;
  const inactiveCount = members.filter((m) => !m.isActive).length;
  const departments = [...new Set(members.map((m) => m.department).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">팀원 관리</h1>
          <p className="text-muted-foreground">팀원을 추가하고 관리할 수 있습니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              팀원 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>팀원 추가</DialogTitle>
              <DialogDescription>
                새로운 팀원을 추가합니다. 입력된 이메일로 초대 메일이 발송됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@company.com"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              {hasDepartments && (
                <div className="space-y-2">
                  <Label htmlFor="department">부서</Label>
                  <Select
                    value={newMember.department}
                    onValueChange={(value) =>
                      setNewMember((prev) => ({ ...prev, department: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="부서 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">권한</Label>
                <Select
                  value={newMember.role}
                  onValueChange={(value: "admin" | "manager" | "worker") =>
                    setNewMember((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">근무자</SelectItem>
                    {hasDepartments && <SelectItem value="manager">팀장</SelectItem>}
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleAddMember}>
                <Mail className="mr-2 h-4 w-4" />
                초대 발송
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 요약 카드 */}
      <div className={`grid gap-4 ${hasDepartments ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">전체 인원</span>
            </div>
            <p className="text-2xl font-bold mt-1">{members.length}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">활성 인원</span>
            </div>
            <p className="text-2xl font-bold mt-1">{activeCount}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-muted-foreground">비활성 인원</span>
            </div>
            <p className="text-2xl font-bold mt-1">{inactiveCount}명</p>
          </CardContent>
        </Card>
        {hasDepartments && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">부서 수</span>
              </div>
              <p className="text-2xl font-bold mt-1">{departments.length}개</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 이메일로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {hasDepartments && (
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="부서" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 부서</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-30">
            <SelectValue placeholder="권한" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="admin">관리자</SelectItem>
            {hasDepartments && <SelectItem value="manager">팀장</SelectItem>}
            <SelectItem value="worker">근무자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>팀원 목록 ({filteredMembers.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                {hasDepartments && <TableHead>부서</TableHead>}
                <TableHead>권한</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  {hasDepartments && <TableCell>{member.department || "-"}</TableCell>}
                  <TableCell>{roleLabels[member.role]}</TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>정보 수정</DropdownMenuItem>
                        <DropdownMenuItem>비밀번호 초기화</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeactivate(member)}
                        >
                          비활성화
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
