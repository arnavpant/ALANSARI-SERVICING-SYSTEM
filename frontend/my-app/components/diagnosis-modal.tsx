"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, AlertCircle, Save, Package, Wrench } from "lucide-react"
import type { Job } from "@/lib/types"
import { toast } from "sonner"

interface DiagnosisModalProps {
  job: Job | null
  onClose: () => void
  onSave: () => void
  onRequestParts?: (job: Job) => void
}

export function DiagnosisModal({ job, onClose, onSave, onRequestParts }: DiagnosisModalProps) {
  const [faultDetails, setFaultDetails] = useState("")
  const [technicalNotes, setTechnicalNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [showPartsDecision, setShowPartsDecision] = useState(false)

  useEffect(() => {
    if (job) {
      setFaultDetails(job.fault_details || "")
      setTechnicalNotes(job.technical_notes || "")
    }
  }, [job])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return

    if (!faultDetails.trim()) {
      toast.error("Fault details are required")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          fault_details: faultDetails,
          technical_notes: technicalNotes,
          status: "IN_DIAGNOSIS",
          diagnosis_date: new Date().toISOString(),
        })
        .eq("id", job.id)

      if (error) throw error

      toast.success("Diagnosis saved successfully")
      setShowPartsDecision(true)
    } catch {
      toast.error("Failed to save diagnosis")
    } finally {
      setSaving(false)
    }
  }

  const handleNoParts = async () => {
    if (!job) return
    try {
      await supabase
        .from("jobs")
        .update({
          status: "READY_FOR_REPAIR",
          repair_type: "NO_PARTS_REQUIRED",
        })
        .eq("id", job.id)

      toast.success("Job ready for repair (No parts needed)")
      onSave()
      onClose()
      setShowPartsDecision(false)
    } catch {
      toast.error("Failed to update job")
    }
  }

  const handleRequiresParts = () => {
    setShowPartsDecision(false)
    onSave()
    onClose()
    if (onRequestParts && job) {
      onRequestParts(job)
    }
  }

  return (
    <>
      <Dialog open={!!job && !showPartsDecision} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Diagnosis & Technical Notes
          </DialogTitle>
          {job && (
            <p className="text-sm text-muted-foreground">
              {job.smart_job_id} - {job.brand} {job.device_type}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {job && (
            <div className="bg-muted rounded-lg p-4 text-sm grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <span className="ml-2 font-medium">{job.retailer_name}</span>
              </div>
              {job.phone_number && (
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2 font-medium">{job.phone_number}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Serial:</span>
                <span className="ml-2 font-medium">{job.serial_number || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Shelf:</span>
                <span className="ml-2 font-medium">{job.shelf_location || "Not Set"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Warranty:</span>
                <span className="ml-2 font-medium">{job.warranty_status || "Unknown"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium text-primary">{job.status.replace(/_/g, " ")}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Fault Details <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={faultDetails}
              onChange={(e) => setFaultDetails(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Technical Notes</Label>
            <Textarea
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              placeholder="Internal observations, test results..."
              rows={6}
            />
          </div>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              After saving, job status changes to <strong>IN_DIAGNOSIS</strong>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Diagnosis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      {/* Parts Decision Dialog */}
      <Dialog open={showPartsDecision} onOpenChange={(open) => !open && setShowPartsDecision(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Parts Required?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Does this repair require replacement parts, or can it be completed with software fixes, cleaning, or
              adjustments only?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                onClick={handleNoParts}
              >
                <Wrench className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">No Parts</div>
                  <div className="text-xs text-muted-foreground">Software/Cleaning</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={handleRequiresParts}
              >
                <Package className="w-8 h-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Requires Parts</div>
                  <div className="text-xs text-muted-foreground">Order replacement</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
