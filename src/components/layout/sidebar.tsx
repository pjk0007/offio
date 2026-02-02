"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Users,
  CheckSquare,
  FileText,
  LogOut,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const workerNav: NavItem[] = [
  { href: "/home", label: "대시보드", icon: <LayoutDashboard size={20} /> },
  { href: "/sessions", label: "근무기록", icon: <Clock size={20} /> },
  { href: "/stats", label: "통계", icon: <BarChart3 size={20} /> },
];

const adminNav: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: <LayoutDashboard size={20} /> },
  { href: "/approvals", label: "승인관리", icon: <CheckSquare size={20} /> },
  { href: "/team", label: "팀원관리", icon: <Users size={20} /> },
  { href: "/reports", label: "리포트", icon: <FileText size={20} /> },
  { href: "/settings", label: "설정", icon: <Settings size={20} /> },
];

interface SidebarProps {
  role: "admin" | "manager" | "worker";
  userName: string;
  companyName: string;
}

export function Sidebar({ role, userName, companyName }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin" || role === "manager";
  const navItems = isAdmin ? adminNav : workerNav;

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={isAdmin ? "/dashboard" : "/home"} className="text-xl font-bold">
          Offio
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{companyName}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={18} />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
