import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { departments, companies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// POST: 부서 생성
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin" || session.user.role === "manager";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const companyId = session.user.companyId;

    // Enterprise 플랜 확인
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));

    if (!company || company.plan !== "enterprise") {
      return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, parentId, managerId, order } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newDepartment = {
      id: randomUUID(),
      companyId,
      name,
      parentId: parentId || null,
      managerId: managerId || null,
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(departments).values(newDepartment);

    return NextResponse.json({ success: true, department: newDepartment });
  } catch (error) {
    console.error("Failed to create department:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
