"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  userName: string;
  role: "admin" | "manager" | "worker";
}

const pathLabels: Record<string, string> = {
  dashboard: "대시보드",
  approvals: "승인관리",
  team: "팀원관리",
  reports: "리포트",
  settings: "설정",
  home: "대시보드",
  sessions: "근무기록",
  stats: "통계",
  vacations: "휴가관리",
  "my-vacations": "휴가관리",
  organization: "조직관리",
  policies: "근무정책",
  analytics: "고급통계",
};

export function AppHeader({ userName, role }: AppHeaderProps) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentPage = pathSegments[0];
  const pageLabel = pathLabels[currentPage] || currentPage;
  const isAdmin = role === "admin" || role === "manager";
  const homeHref = isAdmin ? "/dashboard" : "/home";

  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-background px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href={homeHref}>Offio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
