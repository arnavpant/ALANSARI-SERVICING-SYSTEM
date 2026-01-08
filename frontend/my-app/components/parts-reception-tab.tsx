"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Package, CheckCircle, Truck, MapPin, AlertCircle, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Job, Part } from "@/lib/types"
import { toast } from "sonner"

interface JobWithParts {
  job: Job
  parts: Part[]
}

export function PartsReceptionTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<JobWithParts[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPart, setMarkingPart] = useState<string | null>(null)

  const fetchPendingParts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, parts(*)")
        .or("status.eq.WAITING_FOR_PARTS,status.eq.IN_DIAGNOSIS")
        .neq("status", "CLOSED")
        .order("date_received", { ascending: false })

      if (error) throw error

      const filtered = (data || [])
        .filter((job: Job & { parts: Part[] }) => job.parts?.some((p: Part) => p.status === "ORDERED"))
        .map((job: Job & { parts: Part[] }) => ({
          job,
          parts: job.parts.filter((p: Part) => p.status === "ORDERED"),
        }))

      setResults(filtered)
    } catch {
      toast.error("Failed to load pending parts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingParts()
  }, [fetchPendingParts])

  const handleMarkArrived = async (part: Part, job: Job) => {
    setMarkingPart(part.id)
    try {
      await supabase
        .from("parts")
        .update({ status: "ARRIVED", date_arrived: new Date().toISOString() })
        .eq("id", part.id)

      const { data: allParts } = await supabase.from("parts").select("*").eq("job_id", job.id)

      const allArrived = allParts?.every((p: Part) => p.status === "ARRIVED" || p.status === "INSTALLED")

      if (allArrived) {
        await supabase.from("jobs").update({ status: "READY_FOR_REPAIR" }).eq("id", job.id)
        toast.success(`All parts arrived! Job ${job.smart_job_id} is READY FOR REPAIR`)
      } else {
        const arrivedCount = allParts?.filter((p: Part) => p.status === "ARRIVED" || p.status === "INSTALLED").length || 0
        toast.success(`Part marked as arrived (${arrivedCount}/${allParts?.length} received)`)
      }

      fetchPendingParts()
    } catch {
      toast.error("Failed to update part status")
    } finally {
      setMarkingPart(null)
    }
  }

  const normalize = (str: string | null | undefined) => (str || "").replace(/[-\s_()]/g, "").toLowerCase()

  const filteredResults = results.filter(({ job, parts }) => {
    if (!searchTerm.trim()) return true
    const search = normalize(searchTerm)
    return (
      normalize(job.smart_job_id).includes(search) ||
      normalize(job.serial_number).includes(search) ||
      parts.some((p) => normalize(p.tracking_number).includes(search)) ||
      parts.some((p) => normalize(p.part_name).includes(search))
    )
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Parts Reception</CardTitle>
              <p className="text-sm text-muted-foreground">
                All pending parts - search to filter by tracking number, job ID, or part name
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by tracking number, Job ID, part name..."
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
          <p className="text-sm text-muted-foreground mt-3">
            Showing {filteredResults.length} job(s) with pending parts
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pending parts...</p>
        </Card>
      ) : filteredResults.length > 0 ? (
        <div className="space-y-6">
          {filteredResults.map(({ job, parts }) => (
            <Card key={job.id}>
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{job.smart_job_id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {job.brand} {job.device_type} - {job.serial_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">Shelf: {job.shelf_location || "Not Set"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Waiting {formatDistanceToNow(new Date(job.date_received), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4" />
                  <h4 className="font-semibold">Pending Parts ({parts.length} waiting)</h4>
                </div>

                <div className="space-y-3">
                  {parts.map((part) => (
                    <div key={part.id} className="bg-muted rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{part.part_name}</p>
                          {part.part_number && <p className="text-sm text-muted-foreground">P/N: {part.part_number}</p>}
                          {part.tracking_number && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <Truck className="w-3 h-3" /> {part.tracking_number}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleMarkArrived(part, job)}
                        disabled={markingPart === part.id}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        {markingPart === part.id ? (
                          "Updating..."
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" /> Mark Arrived
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>

              <Alert className="mx-6 mb-6 bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Place arrived parts in <strong>Shelf {job.shelf_location || "TBD"}</strong> with the device.
                </AlertDescription>
              </Alert>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{searchTerm ? "No Matching Parts" : "No Pending Parts"}</h3>
          <p className="text-muted-foreground">
            {searchTerm ? `No parts match your filter "${searchTerm}"` : "All parts have been received!"}
          </p>
        </Card>
      )}
    </div>
  )
}
