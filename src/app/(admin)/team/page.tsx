import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TeamPageClient } from "./team-client";

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin 전용 페이지
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyId;

  const [company] = await db
    .select({ plan: companies.plan })
    .from(companies)
    .where(eq(companies.id, companyId));

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

  return <TeamPageClient members={members} plan={company?.plan ?? "lite"} />;
}
