"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getTeamMembers() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const companyId = session.user.companyId;

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      department: users.department,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.companyId, companyId));

  return members;
}
