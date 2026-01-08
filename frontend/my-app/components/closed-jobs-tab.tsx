"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RefreshCw, Search, Package, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Job } from "@/lib/types"
import { toast } from "sonner"

export function ClosedJobsTab() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchClosedJobs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "CLOSED")
      .order("closed_at", { ascending: false })

    if (error) {
      toast.error("Failed to load closed jobs")
    } else {
      setJobs(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClosedJobs()
  }, [fetchClosedJobs])

  const filteredJobs = jobs.filter(
    (job) =>
      job.smart_job_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.retailer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Closed Jobs</CardTitle>
            <Badge variant="secondary">{filteredJobs.length} jobs</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={fetchClosedJobs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Job ID, Retailer, or Serial Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Job ID</TableHead>
              <TableHead>Retailer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Closed Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading closed jobs...
                </TableCell>
              </TableRow>
            ) : filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {searchTerm ? "No matching closed jobs found" : "No closed jobs yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-primary">{job.smart_job_id || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{job.retailer_name}</div>
                    <div className="text-xs text-muted-foreground">{job.retailer_ref}</div>
                  </TableCell>
                  <TableCell>
                    {job.brand} {job.device_type}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{job.serial_number}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {job.closed_at ? new Date(job.closed_at).toLocaleDateString() : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job.closed_at ? formatDistanceToNow(new Date(job.closed_at)) + " ago" : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => toast.info("Delivery note feature")}
                      title="Generate Delivery Note"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
