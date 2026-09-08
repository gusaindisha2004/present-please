import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  LogOut,
  BookOpen,
  ScanFace,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { Logo } from "@/components/branding/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const basePath = profile?.role === "teacher" ? "/t" : "/s"
  const navItems = [
    { to: basePath, label: "Dashboard", icon: LayoutDashboard },
    // Both roles get a timetable; it's their own schedule either way.
    { to: `${basePath}/timetable`, label: "Timetable", icon: CalendarDays },
    // Teachers reach attendance through a class, so it isn't a destination
    // for them. Students monitor their own, so for them it is.
    ...(profile?.role === "student"
      ? [{ to: `${basePath}/attendance`, label: "Attendance", icon: ClipboardCheck }]
      : []),
    { to: `${basePath}/subjects`, label: "Subjects", icon: BookOpen },
    ...(profile?.role === "student"
      ? [{ to: `${basePath}/profile`, label: "Profile", icon: ScanFace }]
      : []),
  ]
  const currentLabel =
    navItems.find((item) => item.to === location.pathname)?.label ?? "Dashboard"

  // No explicit redirect needed here: signing out clears the user in
  // AuthContext, and ProtectedRoute (wrapping this shell) redirects to
  // /login as soon as that happens.
  const handleSignOut = () => {
    signOut()
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="px-2 py-1.5">
            <Logo
              markClassName="size-6 rounded-md"
              wordmarkClassName="text-base group-data-[collapsible=icon]:hidden"
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-brand-gradient text-xs text-white">
                    {profile ? initials(profile.full_name || profile.email) : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{profile?.full_name || "Account"}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-56">
              <DropdownMenuLabel className="truncate font-normal">
                <div className="truncate text-sm font-medium">
                  {profile?.full_name}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {profile?.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="border-border/60 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">{currentLabel}</span>
        </header>
        <main className="flex-1 px-4 pb-8 sm:px-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
