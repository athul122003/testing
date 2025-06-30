"use client"

import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { UserProfile } from "@/components/user-profile"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1">
              <GlobalSearch />
            </div>
            <UserProfile />
          </header>
          <div className="flex-1 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
