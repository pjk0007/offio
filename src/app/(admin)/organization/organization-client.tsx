"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Network, Plus, Users, Building2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  order: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: "admin" | "manager" | "worker";
  isActive: boolean;
}

interface OrganizationClientProps {
  departments: Department[];
  employees: Employee[];
  isEnterprise?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: "관리자",
  manager: "팀장",
  worker: "근무자",
};

export function OrganizationClient({ departments, employees, isEnterprise = false }: OrganizationClientProps) {
  const router = useRouter();
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editDepartment, setEditDepartment] = useState<string>("");
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptParent, setNewDeptParent] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 부서별 직원 수 계산
  const getDeptEmployeeCount = (deptName: string) => {
    return employees.filter((emp) => emp.department === deptName).length;
  };

  // 고유 부서 목록 (문자열 기반)
  const uniqueDepartments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[];

  const handleAddDepartment = async () => {
    if (!newDeptName) {
      toast.error("부서명을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName,
          parentId: newDeptParent === "none" ? null : newDeptParent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create department");
      }

      toast.success(`${newDeptName} 부서가 생성되었습니다`);
      setIsAddDeptOpen(false);
      setNewDeptName("");
      setNewDeptParent("none");
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "부서 생성에 실패했습니다";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDeptId) return;

    try {
      const response = await fetch(`/api/departments/${deletingDeptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete department");
      }

      toast.success("부서가 삭제되었습니다");
      setDeletingDeptId(null);
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "부서 삭제에 실패했습니다";
      toast.error(message);
    }
  };

  const openEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditDepartment(employee.department || "none");
    setIsEditEmployeeOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${editingEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: editDepartment === "none" ? null : editDepartment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee");
      }

      toast.success("직원 정보가 수정되었습니다");
      setIsEditEmployeeOpen(false);
      setEditingEmployee(null);
      router.refresh();
    } catch {
      toast.error("직원 정보 수정에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">조직관리</h1>
          <p className="text-muted-foreground">부서와 조직 구조를 관리합니다</p>
        </div>
        <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              부서 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>부서 추가</DialogTitle>
              <DialogDescription>새로운 부서를 생성합니다</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>부서명</Label>
                <Input
                  placeholder="부서명을 입력하세요"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
              </div>
              {/* 상위 부서 선택은 Enterprise 전용 (조직 계층 기능) */}
              {isEnterprise && (
                <div className="space-y-2">
                  <Label>상위 부서</Label>
                  <Select value={newDeptParent} onValueChange={setNewDeptParent}>
                    <SelectTrigger>
                      <SelectValue placeholder="상위 부서 선택 (선택)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음 (최상위)</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDeptOpen(false)}>
                취소
              </Button>
              <Button onClick={handleAddDepartment} disabled={isSubmitting}>
                {isSubmitting ? "추가 중..." : "추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 부서 삭제 확인 */}
      <AlertDialog open={!!deletingDeptId} onOpenChange={(open) => !open && setDeletingDeptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>부서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 부서를 삭제하시겠습니까? 하위 부서나 소속 직원이 있으면 삭제할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDepartment}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 직원 부서 변경 */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>직원 정보 수정</DialogTitle>
            <DialogDescription>
              {editingEmployee?.name}님의 소속 부서를 변경합니다
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>소속 부서</Label>
              <Select value={editDepartment} onValueChange={setEditDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEmployeeOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">전체 부서</span>
            </div>
            <p className="text-2xl font-bold mt-1">{departments.length}개</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">전체 직원</span>
            </div>
            <p className="text-2xl font-bold mt-1">{employees.length}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">활성 직원</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {employees.filter((e) => e.isActive).length}명
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 조직도 */}
      <Card>
        <CardHeader>
          <CardTitle>조직도</CardTitle>
          <CardDescription>부서별 구조와 인원을 확인합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              등록된 부서가 없습니다. 부서를 추가해주세요.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => {
                const deptEmployees = employees.filter((e) => e.department === dept.name);
                const manager = deptEmployees.find((e) => e.role === "manager");

                return (
                  <Card key={dept.id} className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeletingDeptId(dept.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {manager ? `팀장: ${manager.name}` : "팀장 미지정"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">인원</span>
                        <Badge variant="secondary">{deptEmployees.length}명</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        {deptEmployees.slice(0, 5).map((emp) => (
                          <div key={emp.id} className="flex items-center justify-between text-sm">
                            <span>{emp.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {roleLabels[emp.role]}
                            </Badge>
                          </div>
                        ))}
                        {deptEmployees.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            외 {deptEmployees.length - 5}명
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 직원 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>직원 목록</CardTitle>
          <CardDescription>전체 직원과 소속 부서를 확인합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabels[employee.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.isActive ? "default" : "secondary"}>
                      {employee.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditEmployee(employee)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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
