export interface User {
  id: string
  email: string
  role: "Admin" | "Front Desk" | "Engineer"
  full_name: string
  linked_engineer_id?: string
}

export interface Job {
  id: string
  smart_job_id?: string
  status: JobStatus
  retailer_name: string
  retailer_ref?: string
  sender_email?: string
  phone_number?: string
  email_subject?: string
  brand?: string
  device_type?: string
  serial_number?: string
  shelf_location?: string
  site_address?: string
  fault_details?: string
  technical_notes?: string
  warranty_status?: string
  service_type?: string
  assigned_engineer_id?: string
  date_received: string
  date_assigned?: string
  diagnosis_date?: string
  completed_at?: string
  closed_at?: string
  updated_at?: string
  created_at: string
  repair_type?: "PARTS_REPLACEMENT" | "NO_PARTS_REQUIRED" | "MIXED"
  // Admin-only fields
  credit_note_no?: string
  credit_note_date?: string
  credit_note_amount_usd?: number
  claim_no?: string
  signed_dn?: boolean
  // Front Desk fields
  airwaybill_no?: string
  airwaybill_date?: string
  duty_paid_to_dhl?: number
  proof_of_purchase?: boolean
}

export type JobStatus =
  | "DRAFT_FROM_EMAIL"
  | "RECEIVED"
  | "ASSIGNED"
  | "IN_DIAGNOSIS"
  | "WAITING_FOR_PARTS"
  | "READY_FOR_REPAIR"
  | "IN_REPAIR"
  | "TESTING"
  | "COMPLETED"
  | "CLOSED"

export interface Engineer {
  id: string
  name: string
  email?: string
  phone?: string
  status: "active" | "inactive"
}

export interface Part {
  id: string
  job_id: string
  part_name: string
  part_number?: string
  tracking_number?: string
  vendor_invoice_no?: string
  cost_price?: number
  is_returnable: boolean
  notes?: string
  status: "ORDERED" | "ARRIVED" | "INSTALLED"
  date_arrived?: string
  created_at: string
}

export interface OldPart {
  id: string
  job_id: string
  part_id: string
  old_part_serial: string
  part_type: string
  part_number?: string
  rma_status: "SCRAP" | "RMA_PENDING"
  removed_at: string
}

export interface SLAData {
  overdueDrafts: Job[]
  stagnantJobs: Job[]
  partsDelay: Job[]
  slaBreach: Job[]
  totalCount: number
}
