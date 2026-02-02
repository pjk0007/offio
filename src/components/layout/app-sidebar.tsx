"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Users,
  CheckSquare,
  FileText,
  LogOut,
  Settings,
  ChevronUp,
  Building2,
  PanelLeftClose,
  PanelLeft,
  CalendarDays,
  Network,
  ScrollText,
  TrendingUp,
} from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  enterpriseOnly?: boolean;
}

// 근무자용 메뉴 (본인 근무 관련)
const workerNav: NavItem[] = [
  { href: "/home", label: "대시보드", icon: LayoutDashboard },
  { href: "/sessions", label: "근무기록", icon: Clock },
  { href: "/stats", label: "통계", icon: BarChart3 },
  { href: "/my-vacations", label: "휴가관리", icon: CalendarDays, enterpriseOnly: true },
];

// 관리자용 메뉴 (팀/조직 관리)
const adminNav: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/approvals", label: "승인관리", icon: CheckSquare },
  { href: "/team", label: "팀원관리", icon: Users },
  { href: "/reports", label: "리포트", icon: FileText },
  { href: "/settings", label: "설정", icon: Settings },
];

// 팀장용 메뉴 (관리 + 본인 근무)
const managerNav: NavItem[] = [
  { href: "/dashboard", label: "팀 대시보드", icon: LayoutDashboard },
  { href: "/approvals", label: "승인관리", icon: CheckSquare },
  { href: "/reports", label: "리포트", icon: FileText },
];

const managerPersonalNav: NavItem[] = [
  { href: "/home", label: "내 대시보드", icon: LayoutDashboard },
  { href: "/sessions", label: "내 근무기록", icon: Clock },
  { href: "/stats", label: "내 통계", icon: BarChart3 },
];

// Standard 이상 Admin 메뉴 (부서 관리)
const standardAdminNav: NavItem[] = [
  { href: "/organization", label: "부서관리", icon: Network },
];

// Enterprise 전용 Admin 메뉴
const enterpriseAdminNav: NavItem[] = [
  { href: "/vacations", label: "휴가관리", icon: CalendarDays },
  { href: "/policies", label: "근무정책", icon: ScrollText },
  { href: "/analytics", label: "고급통계", icon: TrendingUp },
];

interface AppSidebarProps {
  role: "admin" | "manager" | "worker";
  userName: string;
  companyName: string;
  plan?: "lite" | "standard" | "enterprise";
}

function SidebarToggleButton() {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={toggleSidebar}
    >
      {isCollapsed ? (
        <PanelLeft className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
      <span className="sr-only">사이드바 토글</span>
    </Button>
  );
}

export function AppSidebar({ role, userName, companyName, plan = "standard" }: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isLite = plan === "lite";
  const isEnterprise = plan === "enterprise";

  // 역할별 메뉴 구성
  const getNavItems = () => {
    if (isAdmin) return adminNav;
    if (isManager) return managerNav;
    return workerNav.filter(item => !item.enterpriseOnly || isEnterprise);
  };

  const navItems = getNavItems();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || userName.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 border-b">
        <div className="flex h-full items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:hidden">
                <Link href={isAdmin || isManager ? "/dashboard" : "/home"}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Offio</span>
                    <span className="text-xs text-muted-foreground">{companyName}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <div className="hidden group-data-[collapsible=icon]:flex h-full items-center justify-center">
                <SidebarToggleButton />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarToggleButton />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 팀장: 본인 근무 메뉴 */}
        {isManager && (
          <SidebarGroup>
            <SidebarGroupLabel>내 근무</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managerPersonalNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {isEnterprise && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/my-vacations"}
                      tooltip="휴가관리"
                    >
                      <Link href="/my-vacations">
                        <CalendarDays className="size-4" />
                        <span>내 휴가</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Standard 이상 관리 메뉴 (Admin만, 부서관리) */}
        {isAdmin && !isLite && (
          <SidebarGroup>
            <SidebarGroupLabel>조직</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {standardAdminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Enterprise 전용 메뉴 (관리자만) */}
        {isAdmin && isEnterprise && (
          <SidebarGroup>
            <SidebarGroupLabel>Enterprise</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {enterpriseAdminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {role === "admin" ? "관리자" : role === "manager" ? "팀장" : "근무자"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 size-4" />
                        설정
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
