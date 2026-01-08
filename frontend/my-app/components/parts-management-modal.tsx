"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Package, Plus, Trash2, AlertCircle, Wrench } from "lucide-react"
import type { Job, Part } from "@/lib/types"
import { toast } from "sonner"

interface PartsManagementModalProps {
  job: Job | null
  onClose: () => void
  onSave: () => void
}

interface PartFormData {
  part_name: string
  part_number: string
  tracking_number: string
  vendor_invoice_no: string
  cost_price: string
  is_returnable: string
  notes: string
}

const INITIAL_PART: PartFormData = {
  part_name: "",
  part_number: "",
  tracking_number: "",
  vendor_invoice_no: "",
  cost_price: "",
  is_returnable: "true",
  notes: "",
}

export function PartsManagementModal({ job, onClose, onSave }: PartsManagementModalProps) {
  const [existingParts, setExistingParts] = useState<Part[]>([])
  const [newPart, setNewPart] = useState<PartFormData>(INITIAL_PART)
  const [showAddForm, setShowAddForm] = useState(false)
  const [noPartsNeeded, setNoPartsNeeded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (job) {
      fetchParts()
      setNoPartsNeeded(job.repair_type === "NO_PARTS_REQUIRED")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job])

  const fetchParts = async () => {
    if (!job) return
    const { data } = await supabase.from("parts").select("*").eq("job_id", job.id).order("created_at")
    setExistingParts(data || [])
  }

  const handleAddPart = async () => {
    if (!job || !newPart.part_name.trim()) {
      toast.error("Part name is required")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from("parts").insert({
        job_id: job.id,
        part_name: newPart.part_name,
        part_number: newPart.part_number || null,
        tracking_number: newPart.tracking_number || null,
        vendor_invoice_no: newPart.vendor_invoice_no || null,
        cost_price: newPart.cost_price ? Number.parseFloat(newPart.cost_price) : null,
        is_returnable: newPart.is_returnable === "true",
        notes: newPart.notes || null,
        status: "ORDERED",
      })

      if (error) throw error

      toast.success("Part added")
      setNewPart(INITIAL_PART)
      setShowAddForm(false)
      fetchParts()
    } catch {
      toast.error("Failed to add part")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePart = async (partId: string) => {
    if (!confirm("Delete this part?")) return

    try {
      const { error } = await supabase.from("parts").delete().eq("id", partId)
      if (error) throw error
      toast.success("Part deleted")
      fetchParts()
    } catch {
      toast.error("Failed to delete part")
    }
  }

  const handleProceed = async () => {
    if (!job) return

    setSaving(true)
    try {
      if (noPartsNeeded) {
        // No parts required path
        await supabase
          .from("jobs")
          .update({
            status: "READY_FOR_REPAIR",
            repair_type: "NO_PARTS_REQUIRED",
          })
          .eq("id", job.id)

        toast.success("Job ready for repair (No parts)")
      } else if (existingParts.length > 0) {
        // Has parts - update status
        await supabase
          .from("jobs")
          .update({
            status: "WAITING_FOR_PARTS",
            repair_type: "PARTS_REPLACEMENT",
          })
          .eq("id", job.id)

        toast.success(`${existingParts.length} part(s) ordered`)
      } else {
        toast.error("Please add parts or check 'No Parts Needed'")
        setSaving(false)
        return
      }

      onSave()
      onClose()
    } catch {
      toast.error("Failed to update job")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!job} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Parts Management
          </DialogTitle>
          {job && (
            <p className="text-sm text-muted-foreground">
              {job.smart_job_id} - {job.brand} {job.device_type}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Parts */}
          {existingParts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Parts Ordered ({existingParts.length})</h3>
              <div className="space-y-2">
                {existingParts.map((part) => (
                  <Card key={part.id}>
                    <CardContent className="p-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{part.part_name}</span>
                          <Badge variant={part.status === "ARRIVED" ? "default" : "outline"}>{part.status}</Badge>
                        </div>
                        {part.part_number && <p className="text-xs text-muted-foreground">P/N: {part.part_number}</p>}
                        {part.tracking_number && (
                          <p className="text-xs text-muted-foreground">Tracking: {part.tracking_number}</p>
                        )}
                      </div>
                      {part.status === "ORDERED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeletePart(part.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Add New Part Form */}
          {showAddForm ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Add New Part</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>
                      Part Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newPart.part_name}
                      onChange={(e) => setNewPart({ ...newPart, part_name: e.target.value })}
                      placeholder="e.g., LCD Screen, Battery"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Part Number (P/N)</Label>
                    <Input
                      value={newPart.part_number}
                      onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                      placeholder="e.g., L20247-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tracking Number</Label>
                    <Input
                      value={newPart.tracking_number}
                      onChange={(e) => setNewPart({ ...newPart, tracking_number: e.target.value })}
                      placeholder="e.g., 1Z999AA10123456784"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Vendor Invoice</Label>
                    <Input
                      value={newPart.vendor_invoice_no}
                      onChange={(e) => setNewPart({ ...newPart, vendor_invoice_no: e.target.value })}
                      placeholder="e.g., INV-2024-12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newPart.cost_price}
                      onChange={(e) => setNewPart({ ...newPart, cost_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Returnable to Vendor?</Label>
                    <Select
                      value={newPart.is_returnable}
                      onValueChange={(v) => setNewPart({ ...newPart, is_returnable: v })}
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

                  <div className="col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={newPart.notes}
                      onChange={(e) => setNewPart({ ...newPart, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                </div>

                <Button onClick={handleAddPart} disabled={saving} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  {saving ? "Adding..." : "Add Part"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setShowAddForm(true)}
              disabled={noPartsNeeded}
            >
              <Plus className="w-4 h-4" />
              Add Another Part
            </Button>
          )}

          {/* No Parts Needed Checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="noparts"
              checked={noPartsNeeded}
              onCheckedChange={(checked: boolean) => {
                setNoPartsNeeded(checked === true)
                if (checked) setShowAddForm(false)
              }}
            />
            <div className="flex-1">
              <Label htmlFor="noparts" className="cursor-pointer font-medium">
                No parts required for this repair
              </Label>
              <p className="text-xs text-muted-foreground">Software fix, cleaning, adjustment, or testing only</p>
            </div>
            <Wrench className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {noPartsNeeded
                ? "Job will move to READY_FOR_REPAIR without parts"
                : existingParts.length > 0
                  ? `Job status: WAITING_FOR_PARTS (${existingParts.length} ordered)`
                  : "Add parts or check 'No parts required' to proceed"}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            disabled={saving || (!noPartsNeeded && existingParts.length === 0)}
            className="gap-2"
          >
            {saving ? "Saving..." : noPartsNeeded ? "Proceed (No Parts)" : `Proceed (${existingParts.length} parts)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
