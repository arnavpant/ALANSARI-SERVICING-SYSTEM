# Comprehensive Test Plan - Al Ansari System

## Overview
This document outlines all edge cases, scenarios, and test data needed to validate every feature in the system.

---

## 1. JOB STATUS WORKFLOW TESTING

### Status Progression (🤖 AUTOMATED - SQL)
- [x] ✅ DRAFT_FROM_EMAIL → RECEIVED (Drafts Tab)
- [x] ✅ RECEIVED → ASSIGNED (Engineer assignment)
- [x] ✅ ASSIGNED → IN_DIAGNOSIS (Engineer starts diagnosis)
- [x] ✅ IN_DIAGNOSIS → WAITING_FOR_PARTS (Parts needed)
- [x] ✅ WAITING_FOR_PARTS → READY_FOR_REPAIR (Parts arrived)
- [x] ✅ READY_FOR_REPAIR → IN_REPAIR (Repair started)
- [x] ✅ IN_REPAIR → TESTING (Repair complete, testing)
- [x] ✅ TESTING → COMPLETED (Testing passed)
- [x] ✅ COMPLETED → CLOSED (Admin approves & closes)

### Edge Cases (🤖 AUTOMATED - SQL)
- [x] ✅ Job stuck in RECEIVED for 24+ hours (SLA alert)
- [x] ✅ Job stuck in ASSIGNED for 48+ hours (SLA alert)
- [x] ✅ Job stuck in WAITING_FOR_PARTS for 7+ days (SLA alert)
- [x] ✅ Job stuck in any status for extended periods

---

## 2. SLA & ALERT SYSTEM TESTING

### Critical Alerts (Red) (👁️ MANUAL - UI Verification)
- [ ] Job in RECEIVED status for >24 hours → Verify red badge appears on OW-D-LE-D-001 (26h old)
- [ ] Job in ASSIGNED status for >48 hours → Verify red badge appears on IW-F-HP-S-001 (73h old)
- [ ] Job in WAITING_FOR_PARTS for >7 days → Verify red badge appears on OW-D-HP-D-001 (8d old)
- [ ] Job aging >14 days in any status → Verify orange/red badges on 5 jobs older than 14d

### Warning Alerts (Yellow) (👁️ MANUAL - UI Verification)
- [ ] Job approaching SLA thresholds (within 80%) → Verify yellow badge on IW-D-HP-L-001 (23h old)

### Business Hours Edge Cases (🤖 AUTOMATED - SQL)
- [x] ✅ Jobs created on Friday evening (weekend logic)
- [x] ✅ Jobs created on Saturday/Sunday
- [x] ✅ Jobs spanning multiple weekends
- [ ] Jobs created on public holidays (if implemented) → Test manually by creating job on configured holiday

---

## 3. WARRANTY & SERVICE TYPE COMBINATIONS (🤖 AUTOMATED - SQL)

### Warranty Status
- [x] ✅ In Warranty + Depot Service
- [x] ✅ In Warranty + Field Service
- [x] ✅ Out of Warranty + Depot Service
- [x] ✅ Out of Warranty + Field Service
- [ ] AMC + Depot Service → No test data created (rare scenario)
- [x] ✅ AMC + Field Service

### Brand & Device Combinations
- [x] ✅ HP Laptop
- [x] ✅ HP Desktop
- [x] ✅ HP Printer
- [x] ✅ Lenovo Laptop
- [x] ✅ Lenovo Desktop
- [x] ✅ Dell Laptop
- [x] ✅ Dell Server
- [x] ✅ Other Brand + Custom Device Type (Field Service)

---

## 4. ENGINEER ASSIGNMENT TESTING

### Assignment Scenarios (🤖 AUTOMATED - SQL)
- [x] ✅ Unassigned job (RECEIVED status)
- [x] ✅ Assign to ENG1
- [x] ✅ Assign to ENG2
- [x] ✅ Multiple jobs assigned to same engineer

### UI Interactions (👁️ MANUAL - UI Testing)
- [ ] Reassign from ENG1 to ENG2 → Select job, change engineer dropdown, verify update
- [ ] Reassign from ENG2 to ENG1 → Select job, change engineer dropdown, verify update
- [ ] Engineer view filtering (shows only their jobs) → Login as engineer1@alansari.com, verify only 8 jobs visible
- [ ] Admin view (shows all jobs) → Login as admin@alansari.com, verify all 25 jobs visible

--- (🤖 AUTOMATED - SQL)

## 5. PARTS MANAGEMENT TESTING

### Parts Orders
- [x] ✅ Job with no parts ordered
- [x] ✅ Job with 1 part ordered
- [x] ✅ Job with multiple parts (2-5 parts)
- [x] ✅ Parts with tracking numbers
- [x] ✅ Parts without tracking numbers
- [x] ✅ Parts with vendor invoice numbers
- [x] ✅ Parts marked as returnable
- [x] ✅ Parts marked as non-returnable
- [x] ✅ Parts with cost prices
- [x] ✅ Parts with missing cost prices

### Parts Status Progression
- [x] ✅ ORDERED → ARRIVED → INSTALLED
- [x] ✅ Parts ordered at different dates
- [x] ✅ Parts received at different dates
- [x] ✅ Mixed parts (some installed, some waiting)

--- (🤖 AUTOMATED - SQL)

### RMA Scenarios
- [x] ✅ Old part with serial number
- [x] ✅ Old part marked RMA_PENDING
- [x] ✅ Old part marked RMA_SENT
- [x] ✅ Old part marked SCRAP
- [x] ✅ Old part with RMA tracking number
- [x] ✅ Multiple old parts for single job

### UI Testing (👁️ MANUAL)
- [ ] Old part with RMA tracking number → Open job IW-D-HP-L-005, verify 6 old parts with tracking
- [ ] Multiple old parts for single job → Open job IW-D-HP-L-005, verify all 6 old parts display
- [ ] Completion modal requiring old part serials → Complete a job, verify old part serial input required

---

## 7. ADMIN APPROVAL & FINANCIAL INFO

### Financial Data (🤖 AUTOMATED - SQL)
- [x] ✅ Job with no credit note
- [x] ✅ Job with credit note number only
- [x] ✅ Job with complete credit note (number, date, amount)
- [x] ✅ Job with claim number
- [x] ✅ Job with both claim and credit note

### Delivery Note Approval (🤖 AUTOMATED - SQL + 👁️ MANUAL)
- [x] ✅ Job with signed_dn = false (cannot close) - SQL
- [x] ✅ Job with signed_dn = true (can close) - SQL
- [ ] Admin marking delivery note as signed - MANUAL → Login as admin, open Shield modal on IW-D-HP-L-003, check signed_dn
- [ ] Front Desk attempting to close job (should fail) - MANUAL → Login as frontdesk, verify no Close Job button
- [ ] Engineer attempting to close job (should fail) - MANUAL → Login as engineer1, verify no Close Job button

## 8. FRONT DESK SHIPPING & LOGISTICS (🤖 AUTOMATED - SQL)

### Airway Bill & Shipping
- [x] ✅ Job with no shipping info
- [x] ✅ Job with airwaybill number only
- [x] ✅ Job with complete shipping (airwaybill no, date)
- [x] ✅ Job with duty paid to DHL amount
- [x] ✅ Job with proof of purchase = true
- [x] ✅ Job with proof of purchase = false
- [x] ✅ Job with all shipping fields populated

---

## 9. DATA VALIDATION & EDGE CASES

### Required Fields
- [x] ✅ Job with minimal data (retailer name only)
- [x] ✅ Job with complete data (all fields filled)
- [x] ✅ Job with missing serial number
- [x] ✅ Job with missing shelf location
- [x] ✅ Job with very long fault description (>500 chars)
- [x] ✅ Job with special characters in fields

### Dates & Timestamps
- [x] ✅ Job created today
- [x] ✅ Job created 7 days ago
- [x] ✅ Job created 14 days ago
- [x] ✅ Job created 30 days ago
- [x] ✅ Jobs with diagnosis_date in the past
- [x] ✅ Jobs with completed_at timestamp
- [x] ✅ Jobs with closed_at timestamp

---

## 10. SEARCH & FILTERING TESTING

### Search Functionality (👁️ MANUAL)
- [ ] Search by Job ID (smart_job_id) → Search "IW-D-HP-L-001", verify exact match
- [ ] Search by retailer name → Search "Tech Solutions", verify results
- [ ] Search by serial number → Search "SN12345", verify match
- [ ] Search by brand → Search "HP", verify all HP jobs
- [ ] Search by device type → Search "Laptop", verify all laptops
- [ ] Search with partial match → Search "HP-L", verify partial matches
- [ ] Search with special characters → Search with "-", verify handling
- [ ] Search with no results → Search "xyz999", verify empty state

### Tab Filtering (👁️ MANUAL)
- [ ] Drafts tab (DRAFT_FROM_EMAIL only) → Verify only DRAFT-001 appears
- [ ] Active tab (all except DRAFT/CLOSED) → Verify 22 active jobs (not DRAFT or CLOSED)
- [ ] Closed tab (CLOSED only) → Verify 2 closed jobs (AMC-F-HP-S-002, IW-D-HP-L-004)
- [ ] Engineer view (assigned to engineer only) → Login as engineer1, verify 8 jobs only

---

## 11. ROLE-BASED ACCESS TESTING

### Admin Role (👁️ MANUAL)
- [ ] Can view all jobs → Login as admin@alansari.com, verify 25 jobs visible
- [ ] Can edit all fields → Open any job, verify all fields editable
- [ ] Can approve delivery notes → Verify Shield icon visible on Active Jobs tab
- [ ] Can add credit notes/claims → Open Shield modal, verify credit note fields
- [ ] Can close jobs → Verify Close Job button visible on completed jobs
- [ ] Can create users → Verify Create User button in settings/admin area

### Front Desk Role (👁️ MANUAL)
- [ ] Can create jobs → Login as frontdesk@alansari.com, verify Unit Collection works
- [ ] Can edit basic job info → Open job, verify customer/device fields editable
- [ ] Can add shipping/logistics info → Verify airwaybill, duty fields accessible
- [ ] CANNOT edit credit notes/claims → Open job, verify no credit note fields
- [ ] CANNOT approve delivery notes → Verify NO Shield icon on Active Jobs
- [ ] CANNOT close jobs → Open completed job, verify NO Close Job button

### Engineer Role (👁️ MANUAL)
- [ ] Can view assigned jobs only → Login as engineer1@alansari.com, verify 8 jobs
- [ ] Can update diagnosis → Open assigned job, verify diagnosis form works
- [ ] Can add parts → Verify Add Part button works
- [ ] Can mark as complete → Verify Complete button on testing jobs
- [ ] CANNOT edit shipping info → Open job, verify shipping fields disabled/hidden
- [ ] CANNOT edit credit notes → Verify no credit note fields visible
- [ ] CANNOT close jobs → Open completed job, verify NO Close Job button

---

## 12. SMART JOB ID GENERATION

### Format Testing (🤖 AUTOMATED - SQL)
- [x] ✅ IW-D-HP-L-001 (In Warranty, Depot, HP, Laptop)
- [x] ✅ OW-D-LE-D-001 (Out Warranty, Depot, Lenovo, Desktop)
- [x] ✅ IW-F-HP-S-001 (In Warranty, Field, Dell, Server)
- [x] ✅ OW-D-OT-P-001 (Out Warranty, Depot, Other, Printer)
- [x] ✅ AMC-F-HP-T-001 (AMC, Field, HP, Tablet)
- [x] ✅ Sequential numbering for same category
- [ ] Reset counters (if applicable) → Test manually if reset logic exists

---

## 13. UI/UX EDGE CASES

### Visual States (👁️ MANUAL)
- [ ] Empty states (no jobs) → Filter to impossible criteria, verify "No jobs found" message
- [ ] Loading states → Refresh page, verify skeleton/spinner appears
- [ ] Error states → Disconnect network, verify error handling
- [ ] Badge colors for all statuses → Verify DRAFT=gray, RECEIVED=blue, IN_REPAIR=purple, COMPLETED=green, etc.
- [ ] SLA alert styling (red badges, yellow badges) → Verify red on violated jobs, yellow on IW-D-HP-L-001
- [ ] Shelf location highlighting → Verify shelf location displays prominently
- [ ] Long text truncation → Find job with long notes, verify truncation with "..." or expand
- [ ] Responsive layout (different screen sizes) → Test on mobile (375px), tablet (768px), desktop (1920px)

### Modal Interactions (👁️ MANUAL)
- [ ] Unit Collection Modal (create) → Click New Job, fill form, verify save
- [ ] Unit Collection Modal (edit) → Open job, edit fields, verify update
- [ ] Diagnosis Modal → Open IN_DIAGNOSIS job, add diagnosis, verify save
- [ ] Add Part Modal → Click Add Part, fill details, verify part appears
- [ ] Completion Modal (with old parts) → Complete TESTING job, enter old part serials, verify
- [ ] Close Job Modal (admin only) → Login as admin, close completed job with signed DN
- [ ] Admin Approval Modal (admin only) → Click Shield icon, add credit note, verify save
- [ ] Create User Modal (admin only) → Click Create User, add engineer, verify creation

---

## 14. DATABASE INTEGRITY

### Referential Integrity (🤖 AUTOMATED - SQL)
- [x] ✅ Job → Engineer relationship
- [x] ✅ Job → Parts relationship (FK constraint)
- [x] ✅ Parts → Old Parts relationship
- [x] ✅ User → Engineer linking
- [ ] Cascade deletes (if applicable) → Test by deleting a job, verify parts cascade

### Data Consistency (🤖 AUTOMATED - SQL)
- [x] ✅ No orphaned parts
- [x] ✅ No orphaned old parts
- [x] ✅ Valid status transitions
- [x] ✅ Timestamp ordering (created < updated < completed < closed)

---

## 15. PERFORMANCE & STRESS TESTING

### Volume Testing
- [x] ✅ 0 jobs (empty state) - Tested by wiping tables
- [x] ✅ 10 jobs (normal load)
- [x] ✅ 25 jobs (current test data)
- [ ] 50 jobs (medium load) → Create 25 more jobs, verify UI performance
- [ ] 100+ jobs (high load) → Create 75+ more jobs, verify load time <2s
- [ ] Search performance with many jobs → With 100+ jobs, verify search responds <500ms
- [ ] Filter performance with many jobs → With 100+ jobs, verify filter responds <500ms

---

## TEST DATA MATRIX

### Proposed Test Jobs (25-30 jobs covering all scenarios)

| # | Status | Warranty | Service | Brand | Device | Engineer | Parts | Age | SLA | Special Notes |
|---|--------|----------|---------|-------|--------|----------|-------|-----|-----|---------------|
| 1 | DRAFT_FROM_EMAIL | IW | Depot | HP | Laptop | - | 0 | 0d | - | Fresh draft |
| 2 | RECEIVED | IW | Depot | HP | Laptop | - | 0 | 1d | ⚠️ | Approaching 24h SLA |
| 3 | RECEIVED | OW | Depot | Lenovo | Desktop | - | 0 | 2d | 🔴 | SLA violated (>24h) |
| 4 | ASSIGNED | IW | Depot | Dell | Laptop | ENG1 | 0 | 1d | - | Normal assigned |
| 5 | ASSIGNED | IW | Field | HP | Server | ENG2 | 0 | 3d | 🔴 | SLA violated (>48h) |
| 6 | IN_DIAGNOSIS | IW | Depot | HP | Laptop | ENG1 | 0 | 5d | - | Being diagnosed |
| 7 | WAITING_FOR_PARTS | IW | Depot | Lenovo | Laptop | ENG2 | 2 | 3d | - | Parts ordered |
| 8 | WAITING_FOR_PARTS | OW | Depot | HP | Desktop | ENG1 | 1 | 8d | 🔴 | SLA violated (>7d) |
| 9 | READY_FOR_REPAIR | IW | Depot | Dell | Laptop | ENG1 | 3 | 6d | - | Parts received |
| 10 | IN_REPAIR | IW | Depot | HP | Printer | ENG2 | 1 | 7d | - | Repair in progress |
| 11 | TESTING | IW | Depot | Lenovo | Laptop | ENG1 | 2 | 9d | - | Testing |
| 12 | COMPLETED | IW | Depot | HP | Laptop | ENG1 | 1 | 10d | - | Ready to close (no DN) |
| 13 | COMPLETED | OW | Depot | Dell | Desktop | ENG2 | 2 | 11d | - | Ready to close (DN signed) |
| 14 | CLOSED | IW | Depot | HP | Laptop | ENG1 | 1 | 15d | - | Closed & archived |
| 15 | RECEIVED | AMC | Field | Other | Custom | - | 0 | 0d | - | AMC field service |
| 16 | ASSIGNED | IW | Depot | HP | Tablet | ENG1 | 0 | 15d | 🔴 | Old job (>14d) |
| 17 | IN_DIAGNOSIS | OW | Depot | Lenovo | Server | ENG2 | 0 | 20d | 🔴 | Very old job |
| 18 | COMPLETED | IW | Depot | HP | Laptop | ENG1 | 5 | 12d | - | Multiple parts |
| 19 | RECEIVED | IW | Depot | HP | Laptop | - | 0 | 0d | - | With complete shipping info |
| 20 | COMPLETED | OW | Depot | Dell | Laptop | ENG2 | 1 | 10d | - | With credit note |
| 21 | COMPLETED | IW | Depot | HP | Desktop | ENG1 | 0 | 8d | - | No parts job |
| 22 | CLOSED | AMC | Field | HP | Server | ENG2 | 3 | 30d | - | Old closed job |
| 23 | WAITING_FOR_PARTS | IW | Depot | Lenovo | Laptop | ENG1 | 1 | 4d | - | Returnable part |
| 24 | IN_REPAIR | OW | Depot | HP | Printer | ENG2 | 2 | 6d | - | Mixed parts status |
| 25 | RECEIVED | IW | Depot | HP | Laptop | - | 0 | 25h | 🔴 | Just over SLA |

---

## EXPECTED OUTCOMES

After creating test data, we should verify:
1. ✅ All status badges display correctly with proper colors
2. ✅ SLA alerts appear for appropriate jobs
3. ✅ Engineer filtering works (shows only assigned jobs)
4. ✅ Search functionality works across all fields
5. ✅ Admin approval modal shows only for admin
6. ✅ Job closure blocked without signed DN
7. ✅ Parts display correctly in modals
8. ✅ Old parts captured during completion
9. ✅ Role-based field restrictions work
10. ✅ Smart Job IDs generate correctly

---

## PERMISSION TO PROCEED

**Please review this test plan and confirm:**
- [ ] All edge cases covered?
- [ ] Any additional scenarios needed?
- [ ] Ready to create test data?

Once approved, I will create SQL scripts to insert all test jobs with appropriate timestamps, assignments, parts, and edge cases.
