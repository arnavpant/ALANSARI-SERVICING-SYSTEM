"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle, AlertCircle } from "lucide-react"
import type { Job, Part } from "@/lib/types"
import { toast } from "sonner"

interface CompletionModalProps {
  job: Job | null
  onClose: () => void
  onComplete: () => void
}

interface OldPartData {
  oldPartSerial: string
  rmaStatus: "SCRAP" | "RMA_PENDING" | ""
}

export function CompletionModal({ job, onClose, onComplete }: CompletionModalProps) {
  const [parts, setParts] = useState<Part[]>([])
  const [oldPartsData, setOldPartsData] = useState<Record<string, OldPartData>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (job) {
      fetchParts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job])

  const fetchParts = async () => {
    if (!job) return
    const { data } = await supabase.from("parts").select("*").eq("job_id", job.id).eq("status", "ARRIVED")

    if (data) {
      setParts(data)
      const initial: Record<string, OldPartData> = {}
      data.forEach((part: Part) => {
        initial[part.id] = { oldPartSerial: "", rmaStatus: "" }
      })
      setOldPartsData(initial)
    }
  }

  const handleOldPartChange = (partId: string, field: keyof OldPartData, value: string) => {
    setOldPartsData((prev) => ({
      ...prev,
      [partId]: { ...prev[partId], [field]: value },
    }))
    setError("")
  }

  const handleComplete = async () => {
    if (parts.length === 0) {
      // No parts required - complete directly
      setLoading(true)
      try {
        await supabase
          .from("jobs")
          .update({
            status: "COMPLETED",
            completed_at: new Date().toISOString(),
          })
          .eq("id", job!.id)

        toast.success("Job completed (No parts replaced)")
        onComplete()
        onClose()
        return
      } catch {
        toast.error("Failed to complete job")
        return
      } finally {
        setLoading(false)
      }
    }

    const incomplete = parts.filter((part) => {
      const oldData = oldPartsData[part.id]
      return !oldData?.rmaStatus || !oldData?.oldPartSerial?.trim()
    })

    if (incomplete.length > 0) {
      setError(`Please fill in old part details for all ${parts.length} installed parts`)
      return
    }

    setLoading(true)
    try {
      for (const part of parts) {
        await supabase.from("parts").update({ status: "INSTALLED" }).eq("id", part.id)
      }

      for (const part of parts) {
        const oldData = oldPartsData[part.id]
        await supabase.from("old_parts").insert({
          job_id: job!.id,
          part_id: part.id,
          old_part_serial: oldData.oldPartSerial,
          part_type: part.part_name,
          part_number: part.part_number,
          rma_status: oldData.rmaStatus,
          removed_at: new Date().toISOString(),
        })
      }

      await supabase
        .from("jobs")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job!.id)

      toast.success("Job marked as completed!")
      onComplete()
      onClose()
    } catch {
      toast.error("Failed to complete job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!job} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Complete Repair Job
          </DialogTitle>
          {job && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Job ID: {job.smart_job_id}</p>
              <p className="text-sm text-muted-foreground">Customer: {job.retailer_name}</p>
              {job.phone_number && (
                <p className="text-sm text-muted-foreground">Phone: {job.phone_number}</p>
              )}
            </div>
          )}
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            For each NEW part installed, provide details about the OLD/BROKEN part removed.
          </AlertDescription>
        </Alert>

        {parts.length === 0 ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              This job will be completed without parts replacement (software fix, cleaning, or adjustment only).
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold">New Parts Installed ({parts.length})</h3>

            {parts.map((part, index) => {
              const oldData = oldPartsData[part.id] || { oldPartSerial: "", rmaStatus: "" }
              return (
                <div key={part.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        New Part {index + 1}
                      </Badge>
                      <h4 className="font-semibold">{part.part_name}</h4>
                      <p className="text-sm text-muted-foreground">P/N: {part.part_number}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <h5 className="text-sm font-semibold">Old/Broken Part Removed:</h5>
                    <div className="space-y-2">
                      <Label>Serial Number of Old Part *</Label>
                      <Input
                        value={oldData.oldPartSerial}
                        onChange={(e) => handleOldPartChange(part.id, "oldPartSerial", e.target.value)}
                        placeholder="Enter serial number of removed part"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>What to do with old part *</Label>
                      <RadioGroup
                        value={oldData.rmaStatus}
                        onValueChange={(v) => handleOldPartChange(part.id, "rmaStatus", v)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="SCRAP" id={`scrap-${part.id}`} />
                          <Label htmlFor={`scrap-${part.id}`} className="font-normal cursor-pointer">
                            Scrap/Discard
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="RMA_PENDING" id={`rma-${part.id}`} />
                          <Label htmlFor={`rma-${part.id}`} className="font-normal cursor-pointer">
                            Return to Vendor (RMA)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Completing..." : parts.length === 0 ? "Complete (No Parts)" : "Complete Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
