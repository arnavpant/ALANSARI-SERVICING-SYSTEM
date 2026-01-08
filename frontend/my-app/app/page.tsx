"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Toaster, toast } from "sonner"
import type { User, SLAData } from "@/lib/types"
import { getSLAData } from "@/lib/sla-utils"

import { LoginForm } from "@/components/login-form"
import { Sidebar } from "@/components/sidebar"
import { AlertCenter } from "@/components/alert-center"
import { DraftsTab } from "@/components/drafts-tab"
import { ActiveJobsTab } from "@/components/active-jobs-tab"
import { EngineerViewTab } from "@/components/engineer-view-tab"
import { PartsReceptionTab } from "@/components/parts-reception-tab"
import { ClosedJobsTab } from "@/components/closed-jobs-tab"
import { DatabaseViewerTab } from "@/components/database-viewer-tab"
import { CreateUserModal } from "@/components/create-user-modal"

import { Button } from "@/components/ui/button"
import { UserPlus, LogOut } from "lucide-react"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("drafts")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [slaData, setSlaData] = useState<SLAData>({
    overdueDrafts: [],
    stagnantJobs: [],
    partsDelay: [],
    slaBreach: [],
    totalCount: 0,
  })
  const [showAlertPanel, setShowAlertPanel] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)

  // Check auth session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          const { data: userData, error } = await supabase
            .from("users")
            .select("role, full_name, linked_engineer_id")
            .eq("id", session.user.id)
            .single()

          if (!error && userData) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: userData.role,
              full_name: userData.full_name,
              linked_engineer_id: userData.linked_engineer_id,
            })
          }
        }
      } catch {
        console.error("Session error")
      } finally {
        setAuthLoading(false)
      }
    }
    checkSession()
  }, [])

  // Fetch SLA data for admin
  const fetchSLAData = useCallback(async () => {
    if (user?.role !== "Admin") return
    const { data } = await supabase.from("jobs").select("*").neq("status", "CLOSED")
    if (data) {
      setSlaData(getSLAData(data))
    }
  }, [user?.role])

  useEffect(() => {
    fetchSLAData()
    const interval = setInterval(fetchSLAData, 30000)
    return () => clearInterval(interval)
  }, [fetchSLAData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.success("Logged out successfully")
  }

  const getAvailableTabs = () => {
    const role = user?.role
    if (role === "Admin") return ["drafts", "active", "parts", "engineer", "database", "closed"]
    if (role === "Front Desk") return ["drafts", "active", "parts"]
    if (role === "Engineer") return ["engineer"]
    return []
  }

  const availableTabs = getAvailableTabs()

  useEffect(() => {
    if (user && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || "engineer")
    }
  }, [user, availableTabs, activeTab])

  const handleAlertClick = (job: { smart_job_id?: string }, tab: string) => {
    setActiveTab(tab)
    setShowAlertPanel(false)
    toast.info(`Navigated to ${job.smart_job_id || "Draft"}`)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <LoginForm onLoginSuccess={setUser} />
        <Toaster position="bottom-right" richColors />
      </>
    )
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Toaster position="bottom-right" richColors />

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availableTabs={availableTabs}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="relative z-20 flex justify-between items-center p-6 pb-4 shrink-0 border-b border-border bg-background/50 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-foreground">Service Dashboard</h1>

          <div className="flex items-center gap-3">
            {user.role === "Admin" && (
              <AlertCenter
                slaData={slaData}
                isOpen={showAlertPanel}
                onOpenChange={setShowAlertPanel}
                onAlertClick={handleAlertClick}
              />
            )}

            {user.role === "Admin" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => setShowCreateUserModal(true)}
              >
                <UserPlus className="w-4 h-4" /> Create User
              </Button>
            )}

            <div className="text-right">
              <div className="text-sm font-semibold">{user.full_name}</div>
              <div className="text-xs text-muted-foreground">{user.role}</div>
            </div>

            <Button variant="ghost" size="sm" className="text-destructive gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "drafts" && <DraftsTab />}
          {activeTab === "active" && <ActiveJobsTab user={user} />}
          {activeTab === "engineer" && <EngineerViewTab user={user} />}
          {activeTab === "parts" && <PartsReceptionTab />}
          {activeTab === "closed" && <ClosedJobsTab />}
          {activeTab === "database" && <DatabaseViewerTab />}
        </div>
      </main>

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onUserCreated={() => toast.success("User created!")}
      />
    </div>
  )
}
