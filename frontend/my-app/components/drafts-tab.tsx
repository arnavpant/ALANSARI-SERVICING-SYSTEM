"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Plus, Clock, Play } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Job } from "@/lib/types"
import { UnitCollectionModal } from "./unit-collection-modal"
import { toast } from "sonner"

const ONE_DAY = 24 * 60 * 60 * 1000

export function DraftsTab() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "DRAFT_FROM_EMAIL")
      .order("date_received", { ascending: false })

    if (error) {
      toast.error("Failed to fetch drafts")
    } else {
      setJobs(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  const handleProcess = (job: Job) => {
    setSelectedJob(job)
    setShowModal(true)
  }

  const handleNewWalkIn = () => {
    setSelectedJob(null)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedJob(null)
  }

  const handleSave = async () => {
    handleModalClose()
    fetchDrafts()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Pending Intakes</CardTitle>
          <div className="flex gap-2">
            <Button variant="default" size="sm" className="gap-2" onClick={handleNewWalkIn}>
              <Plus className="w-4 h-4" /> New Walk-in
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={fetchDrafts}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Received</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Subject / Fault</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No pending drafts.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const isOverdue = new Date().getTime() - new Date(job.date_received).getTime() > ONE_DAY
                  return (
                    <TableRow key={job.id} className={isOverdue ? "bg-red-50" : ""}>
                      <TableCell>
                        <div className="text-sm">{new Date(job.date_received).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.date_received))} ago
                        </div>
                        {isOverdue && (
                          <Badge variant="destructive" className="mt-1 text-[10px] gap-1">
                            <Clock className="w-3 h-3" /> {">"}24h Overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{job.retailer_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{job.sender_email}</div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[300px]">{job.email_subject || job.fault_details}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="gap-2" onClick={() => handleProcess(job)}>
                          <Play className="w-4 h-4" /> Process
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UnitCollectionModal isOpen={showModal} onClose={handleModalClose} job={selectedJob} onSave={handleSave} />
    </div>
  )
}
