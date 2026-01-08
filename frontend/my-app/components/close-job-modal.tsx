"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PackageCheck, AlertTriangle } from "lucide-react"
import type { Job, User } from "@/lib/types"
import { toast } from "sonner"

interface CloseJobModalProps {
  job: Job | null
  user: User | null
  onClose: () => void
  onClosed: () => void
}

export function CloseJobModal({ job, user, onClose, onClosed }: CloseJobModalProps) {
  const [loading, setLoading] = useState(false)

  const handleClose = async () => {
    if (!job) return
    
    // Only Admin can close jobs
    if (user?.role !== "Admin") {
      toast.error("Only Admin users can close jobs")
      return
    }
    
    // Check if delivery note is signed
    if (!job.signed_dn) {
      toast.error("Delivery note must be signed before closing the job")
      return
    }
    
    setLoading(true)

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "CLOSED",
          closed_at: new Date().toISOString(),
        })
        .eq("id", job.id)

      if (error) throw error

      toast.success(`Job ${job.smart_job_id} closed successfully!`)
      onClosed()
      onClose()
    } catch {
      toast.error("Failed to close job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!job} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-green-600" />
            Close Job & Handover
          </DialogTitle>
          <DialogDescription>Confirm device handover to customer</DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Admin Only:</strong> This action marks the job as <strong>CLOSED</strong> and locks the record. 
            Requires delivery note signature approval. Only proceed if device is being handed over.
          </AlertDescription>
        </Alert>

        {job && (
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Job ID:</span>
              <span className="font-medium">{job.smart_job_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retailer:</span>
              <span className="font-medium">{job.retailer_name}</span>
            </div>
            {job.phone_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{job.phone_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Device:</span>
              <span className="font-medium">
                {job.brand} {job.device_type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial:</span>
              <span className="font-medium font-mono">{job.serial_number || "N/A"}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleClose} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Closing..." : "Confirm Handover & Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
