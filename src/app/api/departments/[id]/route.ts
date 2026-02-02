import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { departments, users, companies } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH: 부서 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin" || session.user.role === "manager";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const companyId = session.user.companyId;

    // 부서 존재 및 소유권 확인
    const [department] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, parentId, managerId, order } = body;

    await db
      .update(departments)
      .set({
        ...(name !== undefined && { name }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(managerId !== undefined && { managerId: managerId || null }),
        ...(order !== undefined && { order }),
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update department:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

// DELETE: 부서 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Only admin can delete departments" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const companyId = session.user.companyId;

    // 부서 존재 및 소유권 확인
    const [department] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // 하위 부서가 있는지 확인
    const childDepartments = await db
      .select()
      .from(departments)
      .where(eq(departments.parentId, id));

    if (childDepartments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with sub-departments" },
        { status: 400 }
      );
    }

    // 해당 부서에 소속된 직원이 있는지 확인
    const employeesInDept = await db
      .select()
      .from(users)
      .where(and(eq(users.companyId, companyId), eq(users.department, department.name)));

    if (employeesInDept.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with employees" },
        { status: 400 }
      );
    }

    await db.delete(departments).where(eq(departments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete department:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
