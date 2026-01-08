"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Plus } from "lucide-react"
import type { Job } from "@/lib/types"
import { toast } from "sonner"

interface AddPartModalProps {
  job: Job | null
  onClose: () => void
  onSave: () => void
}

export function AddPartModal({ job, onClose, onSave }: AddPartModalProps) {
  const [formData, setFormData] = useState({
    part_name: "",
    part_number: "",
    tracking_number: "",
    vendor_invoice_no: "",
    cost_price: "",
    is_returnable: "true",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return

    if (!formData.part_name.trim()) {
      toast.error("Part name is required")
      return
    }

    setSaving(true)
    try {
      const { error: partError } = await supabase.from("parts").insert({
        job_id: job.id,
        part_name: formData.part_name,
        part_number: formData.part_number || null,
        tracking_number: formData.tracking_number || null,
        vendor_invoice_no: formData.vendor_invoice_no || null,
        cost_price: formData.cost_price ? Number.parseFloat(formData.cost_price) : null,
        is_returnable: formData.is_returnable === "true",
        notes: formData.notes || null,
        status: "ORDERED",
      })

      if (partError) throw partError

      // Check if this is the first part for this job
      const { count } = await supabase
        .from("parts")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job.id)

      // Only update status if this was the first part
      if (count === 1) {
        await supabase
          .from("jobs")
          .update({
            status: "WAITING_FOR_PARTS",
            repair_type: "PARTS_REPLACEMENT",
          })
          .eq("id", job.id)
      }

      toast.success("Part added successfully")
      onSave()
      onClose()
      setFormData({
        part_name: "",
        part_number: "",
        tracking_number: "",
        vendor_invoice_no: "",
        cost_price: "",
        is_returnable: "true",
        notes: "",
      })
    } catch {
      toast.error("Failed to add part")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!job} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Add Part
          </DialogTitle>
          {job && (
            <p className="text-sm text-muted-foreground">
              {job.smart_job_id} - {job.brand} {job.device_type}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Part Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.part_name}
              onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
              placeholder="e.g., LCD Screen, Battery, Keyboard"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Part Number (P/N)</Label>
            <Input
              value={formData.part_number}
              onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
              placeholder="e.g., L20247-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                placeholder="e.g., 1Z999AA10123456784"
              />
            </div>
            <div className="space-y-2">
              <Label>Vendor Invoice No.</Label>
              <Input
                value={formData.vendor_invoice_no}
                onChange={(e) => setFormData({ ...formData, vendor_invoice_no: e.target.value })}
                placeholder="e.g., INV-2024-12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cost Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Returnable to Vendor?</Label>
              <Select
                value={formData.is_returnable}
                onValueChange={(v) => setFormData({ ...formData, is_returnable: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes (RMA Eligible)</SelectItem>
                  <SelectItem value="false">No (Scrap Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <Alert>
            <AlertDescription>
              Job status will change to <strong>WAITING_FOR_PARTS</strong>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Plus className="w-4 h-4" />
              {saving ? "Adding..." : "Add Part"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
