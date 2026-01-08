"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Search, X, Edit2, MapPin, Calendar, UserCheck, FileText, PackageCheck, Shield } from "lucide-react"
import type { Job, Engineer, User } from "@/lib/types"
import { getJobSLAStatus } from "@/lib/sla-utils"
import { CloseJobModal } from "./close-job-modal"
import { UnitCollectionModal } from "./unit-collection-modal"
import { AdminJobApprovalModal } from "./admin-job-approval-modal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-purple-100 text-purple-800",
  IN_DIAGNOSIS: "bg-indigo-100 text-indigo-800",
  WAITING_FOR_PARTS: "bg-yellow-100 text-yellow-800",
  READY_FOR_REPAIR: "bg-green-100 text-green-800",
  IN_REPAIR: "bg-orange-100 text-orange-800",
  TESTING: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
}

interface ActiveJobsTabProps {
  user: User | null
}

export function ActiveJobsTab({ user }: ActiveJobsTabProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null)
  const [closingJob, setClosingJob] = useState<Job | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [adminApprovingJob, setAdminApprovingJob] = useState<Job | null>(null)

  const fetchActiveJobs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .neq("status", "DRAFT_FROM_EMAIL")
      .neq("status", "CLOSED")
      .order("date_received", { ascending: false })

    if (error) {
      toast.error("Failed to fetch jobs")
    } else {
      setJobs(data || [])
    }
    setLoading(false)
  }, [])

  const fetchEngineers = useCallback(async () => {
    const { data, error } = await supabase.from("engineers").select("*").eq("status", "active").order("id")

    if (error) {
      setEngineers([
        { id: "ENG1", name: "Engineer 1", status: "active" },
        { id: "ENG2", name: "Engineer 2", status: "active" },
      ])
    } else {
      setEngineers(data || [])
    }
  }, [])

  useEffect(() => {
    fetchActiveJobs()
    fetchEngineers()
  }, [fetchActiveJobs, fetchEngineers])

  const handleAssignEngineer = async (jobId: string, engineerId: string, engineerName: string) => {
    setAssigningJobId(jobId)
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          assigned_engineer_id: engineerId,
          status: "ASSIGNED",
          date_assigned: new Date().toISOString(),
        })
        .eq("id", jobId)

      if (error) {
        toast.error("Failed to assign engineer")
      } else {
        toast.success(`Job assigned to ${engineerName}`)
        fetchActiveJobs()
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setAssigningJobId(null)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      job.serial_number?.toLowerCase().includes(search) ||
      job.retailer_name?.toLowerCase().includes(search) ||
      job.smart_job_id?.toLowerCase().includes(search) ||
      job.brand?.toLowerCase().includes(search) ||
      job.phone_number?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">
              Shop Floor ({filteredJobs.length}
              {searchTerm && ` of ${jobs.length}`})
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={fetchActiveJobs}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Serial Number, Retailer, Job ID, Brand, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Job ID</TableHead>
                <TableHead>Device & Shelf</TableHead>
                <TableHead>Status & Assignment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {searchTerm ? `No jobs matching "${searchTerm}"` : "No active jobs found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => {
                  const sla = getJobSLAStatus(job)
                  return (
                    <TableRow key={job.id} className={cn("transition", sla?.className)}>
                      <TableCell>
                        <span className="font-bold text-lg">{job.smart_job_id}</span>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(job.date_received).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {job.brand} {job.device_type}
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">{job.serial_number}</div>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <MapPin className="w-3 h-3" /> {job.shelf_location || "No Shelf"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={statusColors[job.status] || "bg-gray-100 text-gray-800"}>
                            {job.status.replace(/_/g, " ")}
                          </Badge>
                          {sla && (
                            <Badge variant="destructive" className="animate-pulse">
                              {sla.label}
                            </Badge>
                          )}
                        </div>

                        {(job.status === "RECEIVED" || job.status === "ASSIGNED") && (
                          <div className="flex items-center gap-2 mt-2">
                            {job.assigned_engineer_id && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-purple-600" />
                                {job.assigned_engineer_id}
                              </span>
                            )}
                            <Select
                              value=""
                              onValueChange={(value) => {
                                const eng = engineers.find((e) => e.id === value)
                                if (eng) handleAssignEngineer(job.id, eng.id, eng.name)
                              }}
                              disabled={assigningJobId === job.id}
                            >
                              <SelectTrigger className="h-7 text-xs w-32">
                                <SelectValue placeholder={job.assigned_engineer_id ? "Reassign..." : "Assign..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {engineers.map((eng) => (
                                  <SelectItem key={eng.id} value={eng.id}>
                                    {eng.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user?.role === "Admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => setAdminApprovingJob(job)}
                              title="Admin Approval & Credit Notes"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          {job.status === "COMPLETED" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setClosingJob(job)}
                                title="Close & Handover"
                              >
                                <PackageCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toast.info("Delivery note feature")}
                                title="Generate Delivery Note"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingJob(job)}
                            title="Edit Job"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CloseJobModal job={closingJob} user={user} onClose={() => setClosingJob(null)} onClosed={fetchActiveJobs} />

      <AdminJobApprovalModal
        job={adminApprovingJob}
        onClose={() => setAdminApprovingJob(null)}
        onSaved={fetchActiveJobs}
      />

      <UnitCollectionModal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        job={editingJob}
        onSave={() => {
          setEditingJob(null)
          fetchActiveJobs()
        }}
      />
    </div>
  )
}
