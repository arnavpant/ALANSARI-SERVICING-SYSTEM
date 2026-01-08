"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Shield } from "lucide-react"
import type { Job } from "@/lib/types"
import { toast } from "sonner"

interface AdminJobApprovalModalProps {
  job: Job | null
  onClose: () => void
  onSaved: () => void
}

export function AdminJobApprovalModal({ job, onClose, onSaved }: AdminJobApprovalModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    credit_note_no: "",
    credit_note_date: "",
    credit_note_amount_usd: "",
    claim_no: "",
    signed_dn: false,
  })

  useEffect(() => {
    if (job) {
      setFormData({
        credit_note_no: job.credit_note_no || "",
        credit_note_date: job.credit_note_date || "",
        credit_note_amount_usd: job.credit_note_amount_usd?.toString() || "",
        claim_no: job.claim_no || "",
        signed_dn: job.signed_dn || false,
      })
    }
  }, [job])

  const handleSave = async () => {
    if (!job) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          credit_note_no: formData.credit_note_no || null,
          credit_note_date: formData.credit_note_date || null,
          credit_note_amount_usd: formData.credit_note_amount_usd ? parseFloat(formData.credit_note_amount_usd) : null,
          claim_no: formData.claim_no || null,
          signed_dn: formData.signed_dn,
        })
        .eq("id", job.id)

      if (error) throw error

      toast.success("Admin details updated successfully")
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update admin details")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!job} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Admin Approval & Financial
          </DialogTitle>
          <DialogDescription>
            Manage credit notes, claims, and delivery note approval for Job {job?.smart_job_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Admin Only:</strong> These fields are restricted to administrators.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
              Financial & Claims
            </h3>

            <div className="space-y-2">
              <Label>Claim Number</Label>
              <Input
                value={formData.claim_no}
                onChange={(e) => setFormData({ ...formData, claim_no: e.target.value })}
                placeholder="e.g. CLM-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Credit Note Number</Label>
              <Input
                value={formData.credit_note_no}
                onChange={(e) => setFormData({ ...formData, credit_note_no: e.target.value })}
                placeholder="e.g. CN-2024-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credit Note Date</Label>
                <Input
                  type="date"
                  value={formData.credit_note_date}
                  onChange={(e) => setFormData({ ...formData, credit_note_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.credit_note_amount_usd}
                  onChange={(e) => setFormData({ ...formData, credit_note_amount_usd: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-green-50 border-green-200">
            <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider border-b border-green-300 pb-2">
              Delivery Note Approval
            </h3>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="signed_dn"
                checked={formData.signed_dn}
                onChange={(e) => setFormData({ ...formData, signed_dn: e.target.checked })}
                className="h-5 w-5 rounded border-green-400"
              />
              <Label htmlFor="signed_dn" className="cursor-pointer font-medium text-green-900">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Delivery Note Signed & Approved
                </div>
              </Label>
            </div>

            <Alert className="bg-amber-50 border-amber-300">
              <AlertDescription className="text-amber-900 text-xs">
                Job can only be closed after delivery note is approved. This ensures proper handover documentation.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Saving..." : "Save Admin Details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
