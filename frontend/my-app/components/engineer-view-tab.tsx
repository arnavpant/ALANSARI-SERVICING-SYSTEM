"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wrench, Package, MapPin, Calendar, AlertCircle, FileText, Plus, CheckCircle, Truck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Job, Engineer, Part, User } from "@/lib/types"
import { DiagnosisModal } from "./diagnosis-modal"
import { AddPartModal } from "./add-part-modal"
import { PartsManagementModal } from "./parts-management-modal"
import { CompletionModal } from "./completion-modal"
import { toast } from "sonner"

interface EngineerViewTabProps {
  user: User
}

const statusColors: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_DIAGNOSIS: "bg-purple-100 text-purple-800",
  WAITING_FOR_PARTS: "bg-yellow-100 text-yellow-800",
  READY_FOR_REPAIR: "bg-green-100 text-green-800",
  IN_REPAIR: "bg-orange-100 text-orange-800",
  TESTING: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
}

export function EngineerViewTab({ user }: EngineerViewTabProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEngineerId, setSelectedEngineerId] = useState("")
  const [jobParts, setJobParts] = useState<Record<string, Part[]>>({})
  const [diagnosisJob, setDiagnosisJob] = useState<Job | null>(null)
  const [addPartJob, setAddPartJob] = useState<Job | null>(null)
  const [partsManagementJob, setPartsManagementJob] = useState<Job | null>(null)
  const [completionJob, setCompletionJob] = useState<Job | null>(null)

  const engineerId = user.role === "Engineer" ? user.linked_engineer_id : selectedEngineerId

  const fetchEngineers = useCallback(async () => {
    const { data } = await supabase.from("engineers").select("*").eq("status", "active").order("id")
    setEngineers(data || [])
  }, [])

  const fetchJobs = useCallback(async () => {
    if (!engineerId) {
      setJobs([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_engineer_id", engineerId)
      .neq("status", "CLOSED")
      .order("date_received", { ascending: false })

    if (error) {
      toast.error("Failed to fetch jobs")
      setJobs([])
    } else {
      setJobs(data || [])
      if (data && data.length > 0) {
        fetchPartsForJobs(data.map((j: Job) => j.id))
      }
    }
    setLoading(false)
  }, [engineerId])

  const fetchPartsForJobs = async (jobIds: string[]) => {
    const { data } = await supabase.from("parts").select("*").in("job_id", jobIds).order("created_at")

    if (data) {
      const grouped: Record<string, Part[]> = {}
      data.forEach((part: Part) => {
        if (!grouped[part.job_id]) grouped[part.job_id] = []
        grouped[part.job_id].push(part)
      })
      setJobParts(grouped)
    }
  }

  useEffect(() => {
    if (user.role === "Admin") fetchEngineers()
  }, [user.role, fetchEngineers])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Wrench className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{user.role === "Admin" ? "Engineer Monitoring" : "My Jobs"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {user.role === "Engineer" ? `Logged in as: ${user.email}` : "View jobs assigned to engineers"}
              </p>
            </div>
          </div>

          {user.role === "Admin" && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Monitor Engineer:</span>
              <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Engineer" />
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
        </CardHeader>
      </Card>

      {/* Empty States */}
      {user.role === "Engineer" && !engineerId && (
        <Card className="p-12 text-center">
          <Wrench className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile Not Linked</h3>
          <p className="text-muted-foreground">Your account is not linked to an engineer profile.</p>
        </Card>
      )}

      {user.role === "Admin" && !engineerId && (
        <Card className="p-12 text-center">
          <Wrench className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select an Engineer</h3>
          <p className="text-muted-foreground">Choose an engineer from the dropdown above</p>
        </Card>
      )}

      {engineerId && loading && (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading jobs...</p>
        </Card>
      )}

      {engineerId && !loading && jobs.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Jobs Assigned</h3>
          <p className="text-muted-foreground">
            {user.role === "Admin" ? "This engineer has no active jobs" : "You don't have any active jobs"}
          </p>
        </Card>
      )}

      {/* Jobs List */}
      {engineerId && !loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{job.smart_job_id}</h3>
                    <p className="text-muted-foreground">
                      {job.brand} {job.device_type}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Badge className={statusColors[job.status]}>{job.status.replace(/_/g, " ")}</Badge>
                    {jobParts[job.id] && jobParts[job.id].length > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Package className="w-3 h-3" />
                        {jobParts[job.id].length} {jobParts[job.id].length === 1 ? "Part" : "Parts"}
                      </Badge>
                    )}
                    {job.repair_type === "NO_PARTS_REQUIRED" && (
                      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                        <Wrench className="w-3 h-3" />
                        No Parts
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Serial:</span>
                    <span className="font-medium">{job.serial_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Shelf:</span>
                    <span className="font-medium">{job.shelf_location || "Not Set"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Received:</span>
                    <span className="font-medium">
                      {job.date_received
                        ? formatDistanceToNow(new Date(job.date_received), { addSuffix: true })
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {job.fault_details && (
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">Reported Issue:</p>
                        <p className="text-sm text-muted-foreground">{job.fault_details}</p>
                      </div>
                    </div>
                  </div>
                )}

                {job.technical_notes && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-700 mb-1">Technical Notes:</p>
                        <p className="text-sm text-blue-600 whitespace-pre-wrap">{job.technical_notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Parts List */}
                {jobParts[job.id] && jobParts[job.id].length > 0 && (
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4" />
                      <p className="text-sm font-medium">Parts Ordered ({jobParts[job.id].length}):</p>
                    </div>
                    <div className="space-y-2">
                      {jobParts[job.id].map((part) => (
                        <div key={part.id} className="bg-card rounded p-3 text-sm border">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{part.part_name}</p>
                              {part.part_number && (
                                <p className="text-xs text-muted-foreground">P/N: {part.part_number}</p>
                              )}
                              {part.tracking_number && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Truck className="w-3 h-3" /> {part.tracking_number}
                                </div>
                              )}
                            </div>
                            <Badge
                              variant={
                                part.status === "ARRIVED"
                                  ? "default"
                                  : part.status === "INSTALLED"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {part.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 gap-2" onClick={() => setDiagnosisJob(job)}>
                    <FileText className="w-4 h-4" />
                    {job.status === "ASSIGNED" ? "Start Diagnosis" : "Update Diagnosis"}
                  </Button>
                  {job.status === "IN_DIAGNOSIS" ? (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 bg-transparent"
                      onClick={() => setPartsManagementJob(job)}
                    >
                      <Package className="w-4 h-4" />
                      Manage Parts
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setAddPartJob(job)}>
                      <Plus className="w-4 h-4" />
                      Add Part
                    </Button>
                  )}
                  {["READY_FOR_REPAIR", "IN_REPAIR", "TESTING"].includes(job.status) && (
                    <Button
                      variant="secondary"
                      className="flex-1 gap-2 bg-purple-100 text-purple-800 hover:bg-purple-200"
                      onClick={() => setCompletionJob(job)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Job
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DiagnosisModal
        job={diagnosisJob}
        onClose={() => setDiagnosisJob(null)}
        onSave={fetchJobs}
        onRequestParts={(job) => setPartsManagementJob(job)}
      />
      <AddPartModal job={addPartJob} onClose={() => setAddPartJob(null)} onSave={fetchJobs} />
      <PartsManagementModal
        job={partsManagementJob}
        onClose={() => setPartsManagementJob(null)}
        onSave={fetchJobs}
      />
      <CompletionModal job={completionJob} onClose={() => setCompletionJob(null)} onComplete={fetchJobs} />
    </div>
  )
}
