"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Clock, Mail, User, CheckCircle, X, ArrowRight } from "lucide-react"
import type { SLAData, Job } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AlertCenterProps {
  slaData: SLAData
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAlertClick: (job: Job, tab: string) => void
}

export function AlertCenter({ slaData, isOpen, onOpenChange, onAlertClick }: AlertCenterProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onOpenChange])

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "relative",
          slaData.totalCount > 0 && "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
        )}
      >
        <Bell className="w-5 h-5" />
        {slaData.totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
            {slaData.totalCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-card rounded-xl border border-border shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="bg-muted/50 p-3 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Alert Center
            </h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {slaData.totalCount === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2 opacity-50" />
                <p className="text-sm">All systems normal.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Global Breaches */}
                {slaData.slaBreach.map((job) => (
                  <AlertItem
                    key={job.id}
                    job={job}
                    icon={<AlertTriangle className="w-3 h-3" />}
                    label="Global Breach (15d+)"
                    variant="destructive"
                    onClick={() => onAlertClick(job, "active")}
                  />
                ))}

                {/* Parts Delay */}
                {slaData.partsDelay.map((job) => (
                  <AlertItem
                    key={job.id}
                    job={job}
                    icon={<Clock className="w-3 h-3" />}
                    label="Parts Delayed (7d+)"
                    variant="warning"
                    onClick={() => onAlertClick(job, "active")}
                  />
                ))}

                {/* Stagnant Jobs */}
                {slaData.stagnantJobs.map((job) => (
                  <AlertItem
                    key={job.id}
                    job={job}
                    icon={<User className="w-3 h-3" />}
                    label="Stagnant Repair (48h+)"
                    variant="secondary"
                    onClick={() => onAlertClick(job, "active")}
                  />
                ))}

                {/* Overdue Drafts */}
                {slaData.overdueDrafts.map((job) => (
                  <AlertItem
                    key={job.id}
                    job={job}
                    icon={<Mail className="w-3 h-3" />}
                    label="Overdue Draft (24h+)"
                    variant="outline"
                    onClick={() => onAlertClick(job, "drafts")}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertItem({
  job,
  icon,
  label,
  variant,
  onClick,
}: {
  job: Job
  icon: React.ReactNode
  label: string
  variant: "destructive" | "warning" | "secondary" | "outline"
  onClick: () => void
}) {
  const colorClasses = {
    destructive: "hover:bg-red-50 text-red-700",
    warning: "hover:bg-orange-50 text-orange-700",
    secondary: "hover:bg-purple-50 text-purple-700",
    outline: "hover:bg-muted text-foreground",
  }

  return (
    <button onClick={onClick} className={cn("w-full p-3 text-left transition group", colorClasses[variant])}>
      <div className="flex justify-between items-start mb-1">
        <Badge variant={variant === "warning" ? "outline" : variant} className="text-xs gap-1">
          {icon} {label}
        </Badge>
        <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
          {job.smart_job_id || "DRAFT"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-1 truncate">
        {job.brand} {job.device_type}
      </p>
      <div className="text-[10px] font-medium flex items-center gap-1 text-primary">
        View Job <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
      </div>
    </button>
  )
}
