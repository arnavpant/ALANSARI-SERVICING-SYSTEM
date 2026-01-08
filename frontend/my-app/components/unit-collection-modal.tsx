"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save } from "lucide-react"
import type { Job } from "@/lib/types"
import { toast } from "sonner"

interface UnitCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  job: Job | null
  onSave: () => void
}

const INITIAL_FORM = {
  retailer_ref: "",
  retailer_name: "",
  phone_number: "",
  warranty_status: "In Warranty",
  service_type: "Depot",
  device_type: "Laptop",
  brand: "",
  serial_number: "",
  shelf_location: "",
  site_address: "",
  fault_details: "",
  sender_email: "",
  airwaybill_no: "",
  airwaybill_date: "",
  duty_paid_to_dhl: "",
  proof_of_purchase: false,
}

export function UnitCollectionModal({ isOpen, onClose, job, onSave }: UnitCollectionModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [showCustomBrand, setShowCustomBrand] = useState(false)

  const isManual = !job?.id

  useEffect(() => {
    if (job) {
      setFormData({
        retailer_ref: job.retailer_ref || "",
        retailer_name: job.retailer_name || "",
        phone_number: job.phone_number || "",
        warranty_status: job.warranty_status || "In Warranty",
        service_type: job.service_type || "Depot",
        device_type: job.device_type || "Laptop",
        brand: job.brand || "",
        serial_number: job.serial_number || "",
        shelf_location: job.shelf_location || "",
        site_address: job.site_address || "",
        fault_details: job.fault_details || job.email_subject || "",
        sender_email: job.sender_email || "",
        airwaybill_no: job.airwaybill_no || "",
        airwaybill_date: job.airwaybill_date || "",
        duty_paid_to_dhl: job.duty_paid_to_dhl?.toString() || "",
        proof_of_purchase: job.proof_of_purchase || false,
      })
    } else {
      setFormData(INITIAL_FORM)
    }
    setError("")
  }, [job, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.retailer_name.trim()) {
      setError("Retailer / Customer name is required.")
      return
    }

    setSaving(true)
    setError("")

    try {
      // Only generate smart job ID for new jobs or when transitioning from DRAFT
      let smartId = job?.smart_job_id
      
      // Generate new smart_job_id if creating new job or updating from DRAFT
      if (isManual || (job?.status === "DRAFT_FROM_EMAIL")) {
        const { data: newSmartId, error: rpcError } = await supabase.rpc("generate_smart_job_id", {
          p_warranty_status: formData.warranty_status,
          p_service_type: formData.service_type,
          p_brand: formData.brand,
          p_device_type: formData.device_type,
        })

        if (rpcError) {
          console.error("RPC Error:", rpcError)
          toast.error("Error generating Job ID")
          setSaving(false)
          return
        }
        
        smartId = newSmartId
      }

      const payload = {
        retailer_ref: formData.retailer_ref || null,
        retailer_name: formData.retailer_name,
        phone_number: formData.phone_number || null,
        warranty_status: formData.warranty_status,
        service_type: formData.service_type,
        device_type: formData.device_type,
        brand: formData.brand,
        serial_number: formData.serial_number || null,
        shelf_location: formData.service_type === "Depot" ? formData.shelf_location || null : null,
        site_address: formData.service_type === "Field Service" ? formData.site_address || null : null,
        fault_details: formData.fault_details || null,
        sender_email: formData.sender_email || null,
        smart_job_id: smartId,
        status: "RECEIVED" as const,
        date_received: job?.date_received || new Date().toISOString(),
        airwaybill_no: formData.airwaybill_no || null,
        airwaybill_date: formData.airwaybill_date || null,
        duty_paid_to_dhl: formData.duty_paid_to_dhl ? parseFloat(formData.duty_paid_to_dhl) : null,
        proof_of_purchase: formData.proof_of_purchase,
      }

      if (isManual) {
        const { error: insertError } = await supabase.from("jobs").insert([payload])
        if (insertError) {
          console.error("Insert Error:", insertError)
          throw insertError
        }
      } else {
        const { error: updateError } = await supabase.from("jobs").update(payload).eq("id", job.id)
        if (updateError) {
          console.error("Update Error:", updateError)
          throw updateError
        }
      }

      toast.success(`Job Registered: ${smartId}`)
      onSave()
      onClose()
    } catch (err) {
      console.error("Save Error:", err)
      toast.error("Failed to save job")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isManual ? "New Walk-in Job" : "Unit Collection Form"}</DialogTitle>
          <DialogDescription>
            {isManual ? "Enter details for a new device intake." : `Processing draft from: ${job?.sender_email}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                Device Details
              </h3>

              <div className="space-y-2">
                <Label>Customer / Retailer *</Label>
                <Input
                  value={formData.retailer_name}
                  onChange={(e) => setFormData({ ...formData, retailer_name: e.target.value })}
                  placeholder="e.g. John Doe or Lulu Hypermarket"
                  required
                />
              </div>

              {isManual && (
                <div className="space-y-2">
                  <Label>Customer Email</Label>
                  <Input
                    type="email"
                    value={formData.sender_email}
                    onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g. +968 9123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Depot">Depot (Service Center)</SelectItem>
                    <SelectItem value="Field Service">Field Service (Off-Site)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand *</Label>
                {formData.service_type === "Depot" && !showCustomBrand ? (
                  <Select 
                    value={formData.brand} 
                    onValueChange={(value) => {
                      if (value === "Other") {
                        setShowCustomBrand(true)
                        setFormData({ ...formData, brand: "" })
                      } else {
                        setFormData({ ...formData, brand: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HP">HP</SelectItem>
                      <SelectItem value="Lenovo">Lenovo</SelectItem>
                      <SelectItem value="Dell">Dell</SelectItem>
                      <SelectItem value="Other">Other (Type Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder={formData.service_type === "Depot" ? "e.g. Acer, Asus, Apple, Custom Brand" : "e.g. Dell Server, Custom Rig"}
                    />
                    {formData.service_type === "Depot" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomBrand(false)
                          setFormData({ ...formData, brand: "" })
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        ← Back to brand selection
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Device Type</Label>
                {formData.service_type === "Depot" ? (
                  <Select
                    value={formData.device_type}
                    onValueChange={(value) => setFormData({ ...formData, device_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Desktop">Desktop</SelectItem>
                      <SelectItem value="Consumer Printer">Consumer Printer</SelectItem>
                      <SelectItem value="Commercial Printer">Commercial Printer</SelectItem>
                      <SelectItem value="Server">Server</SelectItem>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.device_type}
                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                    placeholder="e.g. Server Rack, Network Switch"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="e.g. 5CD2349JKA"
                  className="font-mono uppercase"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                Intake Logistics
              </h3>

              {formData.service_type === "Depot" ? (
                <div className="space-y-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <Label className="text-amber-800 font-semibold">Shelf Location</Label>
                  <Input
                    value={formData.shelf_location}
                    onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                    placeholder="e.g. A-12"
                    className="text-lg font-bold border-amber-300"
                  />
                </div>
              ) : (
                <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Label className="text-blue-800 font-semibold">Site Address *</Label>
                  <Textarea
                    value={formData.site_address}
                    onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                    placeholder="Enter customer site address for field visit..."
                    rows={3}
                    className="border-blue-300"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Warranty Status</Label>
                <Select
                  value={formData.warranty_status}
                  onValueChange={(value) => setFormData({ ...formData, warranty_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Warranty">In Warranty (Standard)</SelectItem>
                    <SelectItem value="Out of Warranty">Out of Warranty (Billable)</SelectItem>
                    <SelectItem value="AMC">AMC / Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Retailer Reference No.</Label>
                <Input
                  value={formData.retailer_ref}
                  onChange={(e) => setFormData({ ...formData, retailer_ref: e.target.value })}
                  placeholder="e.g. RMA-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label>Reported Fault</Label>
                <Textarea
                  value={formData.fault_details}
                  onChange={(e) => setFormData({ ...formData, fault_details: e.target.value })}
                  rows={4}
                  placeholder="Describe the issue..."
                />
              </div>

              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 mt-6">
                Shipping & Documentation
              </h3>

              <div className="space-y-2">
                <Label>Airway Bill No.</Label>
                <Input
                  value={formData.airwaybill_no}
                  onChange={(e) => setFormData({ ...formData, airwaybill_no: e.target.value })}
                  placeholder="e.g. AWB123456789"
                />
              </div>

              <div className="space-y-2">
                <Label>Airway Bill Date</Label>
                <Input
                  type="date"
                  value={formData.airwaybill_date}
                  onChange={(e) => setFormData({ ...formData, airwaybill_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Duty Paid to DHL (RO)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.duty_paid_to_dhl}
                  onChange={(e) => setFormData({ ...formData, duty_paid_to_dhl: e.target.value })}
                  placeholder="e.g. 12.50"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="proof_of_purchase"
                  checked={formData.proof_of_purchase}
                  onChange={(e) => setFormData({ ...formData, proof_of_purchase: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="proof_of_purchase" className="cursor-pointer">
                  Proof of Purchase Received
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : isManual ? "Create Job" : "Save & Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
