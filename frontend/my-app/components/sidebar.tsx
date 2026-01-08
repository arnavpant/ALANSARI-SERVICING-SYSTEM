"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Inbox, Wrench, Package, Database, Archive, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  availableTabs: string[]
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

const tabConfig: Record<string, { icon: React.ElementType; label: string }> = {
  drafts: { icon: Inbox, label: "Drafts" },
  active: { icon: LayoutDashboard, label: "Active Jobs" },
  parts: { icon: Package, label: "Parts Reception" },
  engineer: { icon: Wrench, label: "Engineer View" },
  database: { icon: Database, label: "Database" },
  closed: { icon: Archive, label: "Closed Jobs" },
}

export function Sidebar({ activeTab, onTabChange, availableTabs, collapsed, onCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "bg-card border-r border-border h-full flex flex-col transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && <span className="font-semibold text-foreground">Navigation</span>}
        <Button variant="ghost" size="icon" onClick={() => onCollapse(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {availableTabs.map((tab) => {
          const config = tabConfig[tab]
          if (!config) return null
          const Icon = config.icon

          return (
            <Button
              key={tab}
              variant={activeTab === tab ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")}
              onClick={() => onTabChange(tab)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{config.label}</span>}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
