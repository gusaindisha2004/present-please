import type { ReactNode } from "react"
import { LayoutDashboard, LogOut, GraduationCap } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
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
          <div className="flex items-center gap-2 px-2 py-1.5">
            <GraduationCap className="text-primary size-5 shrink-0" />
            <span className="truncate font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Present Please!
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
        <header className="flex h-14 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium capitalize">
            {profile?.role} dashboard
          </span>
        </header>
        <main className="flex-1 px-4 pb-8 sm:px-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
