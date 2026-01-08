# Smart Job ID System - Manual Test Guide
**Date:** January 7, 2026  
**Module:** 2.1 - Active Job Transition with Waterfall ID Logic

---

## Prerequisites
- ✅ Jobs table cleared
- ✅ Counters reset to base values (LEN:1000, HPP:2000, HP:3000, FLD:4000, OOW:5000, GEN:6000)
- ✅ Frontend running on localhost
- ✅ Logged in as Front Desk user

---

## Test Scenarios

### **Test 1: Priority 1 - Out of Warranty (OOW)**
**Purpose:** Verify that warranty status overrides all other conditions

**Steps:**
1. Click "New Walk-in Job" or process a draft email
2. Fill in:
   - **Customer Name:** Test Customer 1
   - **Warranty Status:** Out of Warranty
   - **Service Type:** Depot
   - **Brand:** HP (or any brand)
   - **Device Type:** Laptop
   - **Shelf Location:** A-01
3. Click "Save & Register"

**Expected Result:**
- ✅ Job ID: `OOW-5001`
- ✅ Status changes to "RECEIVED"
- ✅ Success toast: "Job Registered: OOW-5001"
- ✅ Shelf location saved (even though it's OOW)

**Why:** Out of Warranty is Priority 1 - brand/device doesn't matter

---

### **Test 2: Priority 1 - Second OOW Job**
**Purpose:** Verify counter increments correctly

**Steps:**
1. Create another job with:
   - **Customer Name:** Test Customer 2
   - **Warranty Status:** Out of Warranty
   - **Service Type:** Field Service ← Different!
   - **Brand:** Lenovo ← Different!
   - **Device Type:** Desktop
   - **Site Address:** "123 Main St, Muscat"

**Expected Result:**
- ✅ Job ID: `OOW-5002` (incremented)
- ✅ Site address field visible (Field Service)
- ✅ Shelf location hidden

**Why:** OOW overrides Field Service priority

---

### **Test 3: Priority 2 - Field Service with HP**
**Purpose:** Verify Field Service creates FLD-BRAND format

**Steps:**
1. Create job with:
   - **Customer Name:** Field Test HP
   - **Warranty Status:** In Warranty ← Important!
   - **Service Type:** Field Service
   - **Brand:** HP
   - **Device Type:** Laptop (or enter custom text)
   - **Site Address:** "Al Qurum, Office 204"

**Expected Result:**
- ✅ Job ID: `FLD-HP-4001`
- ✅ Site Address field visible (blue box)
- ✅ Shelf Location field hidden
- ✅ Site address saved to database

**Why:** In-Warranty + Field Service = FLD-BRAND format

---

### **Test 4: Priority 2 - Field Service with Lenovo**
**Purpose:** Verify brand tag changes in Field Service

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Field Service
   - **Brand:** Lenovo
   - **Device Type:** Desktop
   - **Site Address:** "Seeb Industrial Area"

**Expected Result:**
- ✅ Job ID: `FLD-LEN-4002`
- ✅ Different brand tag than previous Field Service

---

### **Test 5: Priority 2 - Field Service with Dell**
**Purpose:** Verify custom brand tags

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Field Service
   - **Brand:** Dell (or type custom brand like "Custom Server")
   - **Site Address:** "Ruwi, Building 5"

**Expected Result:**
- ✅ Job ID: `FLD-DELL-4003` (or `FLD-CUS-4003` if custom)
- ✅ First 3 letters of brand used as tag

---

### **Test 6: Priority 3 - HP Consumer Printer**
**Purpose:** Verify Consumer Printer gets HPP series

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Depot ← Important!
   - **Brand:** HP
   - **Device Type:** Consumer Printer ← New option!
   - **Shelf Location:** P-WIDE-01

**Expected Result:**
- ✅ Job ID: `HPP-2001`
- ✅ Shelf Location visible (amber box)
- ✅ Site Address hidden

**Why:** HP Consumer Printer = Printer Zone (wide racks)

---

### **Test 7: Priority 4 - HP Commercial Printer**
**Purpose:** Verify Commercial Printer gets HP series (not HPP)

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Depot
   - **Brand:** HP
   - **Device Type:** Commercial Printer ← Different from Consumer!
   - **Shelf Location:** HP-SEC-12

**Expected Result:**
- ✅ Job ID: `HP-3001` (NOT HPP!)
- ✅ Goes to standard HP storage area

**Why:** Commercial printers stored in HP secure area, not printer zone

---

### **Test 8: Priority 4 - HP Laptop**
**Purpose:** Verify HP laptops use HP series

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Depot
   - **Brand:** HP
   - **Device Type:** Laptop
   - **Shelf Location:** HP-LAP-05

**Expected Result:**
- ✅ Job ID: `HP-3002`
- ✅ Same series as HP Commercial Printer

---

### **Test 9: Priority 5 - Lenovo Laptop**
**Purpose:** Verify Lenovo gets dedicated series

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Depot
   - **Brand:** Lenovo
   - **Device Type:** Laptop
   - **Shelf Location:** LEN-A-03

**Expected Result:**
- ✅ Job ID: `LEN-1001`
- ✅ Dedicated Lenovo shelf area

---

### **Test 10: Priority 6 - Dell Laptop (General)**
**Purpose:** Verify catch-all for other brands

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Depot
   - **Brand:** Dell
   - **Device Type:** Laptop
   - **Shelf Location:** GEN-D-08

**Expected Result:**
- ✅ Job ID: `GEN-6001`

---

### **Test 11: Priority 6 - Acer/Other Brand**
**Purpose:** Verify other brands also go to GEN

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Depot
   - **Brand:** Other (or select and type "Acer")
   - **Device Type:** Desktop
   - **Shelf Location:** GEN-M-12

**Expected Result:**
- ✅ Job ID: `GEN-6002`

---

## Priority Override Testing

### **Test 12: OOW Overrides HP Consumer Printer**
**Purpose:** Verify Priority 1 beats Priority 3

**Steps:**
1. Create job with:
   - **Warranty Status:** Out of Warranty ← Priority 1
   - **Service Type:** Depot
   - **Brand:** HP
   - **Device Type:** Consumer Printer ← Would be HPP if In-Warranty

**Expected Result:**
- ✅ Job ID: `OOW-5003` (NOT HPP-2002!)

**Why:** Financial status (OOW) overrides shelf location logic

---

### **Test 13: Field Service Overrides Brand-Specific Series**
**Purpose:** Verify Priority 2 beats Priorities 3-6

**Steps:**
1. Create job with:
   - **Warranty Status:** In Warranty
   - **Service Type:** Field Service ← Priority 2
   - **Brand:** HP
   - **Device Type:** Consumer Printer ← Would be HPP if Depot

**Expected Result:**
- ✅ Job ID: `FLD-HP-4004` (NOT HPP!)
- ✅ Site Address field visible

**Why:** Site visit logistics override shelf storage logic

---

## Edge Cases

### **Test 14: Email Draft Transition**
**Purpose:** Verify Draft → Received with ID generation

**Prerequisites:** Have backend email watcher create a draft job

**Steps:**
1. Go to "Drafts" tab
2. Click "Process" on a draft email
3. Fill Unit Collection form
4. Select: In Warranty, Depot, Lenovo, Laptop
5. Add shelf location
6. Save & Register

**Expected Result:**
- ✅ New smart_job_id generated (e.g., LEN-1002)
- ✅ Status changes DRAFT_FROM_EMAIL → RECEIVED
- ✅ Original sender_email preserved
- ✅ Original date_received preserved

---

### **Test 15: UI Conditional Rendering**
**Purpose:** Verify field visibility toggles correctly

**Steps:**
1. Open Unit Collection Modal
2. **Set Service Type = Depot:**
   - ✅ Shelf Location visible (amber box)
   - ✅ Site Address hidden
3. **Change Service Type = Field Service:**
   - ✅ Site Address visible (blue box)
   - ✅ Shelf Location hidden
4. **Switch back to Depot:**
   - ✅ Fields toggle back

**Expected Result:**
- ✅ Real-time UI updates
- ✅ No form data loss when toggling

---

### **Test 16: Database Validation**
**Purpose:** Verify data saved correctly

**Steps:**
After creating Test 3 (FLD-HP-4001), run this SQL:

```sql
SELECT 
  smart_job_id,
  service_type,
  site_address,
  shelf_location,
  status
FROM jobs 
WHERE smart_job_id = 'FLD-HP-4001';
```

**Expected Result:**
```
smart_job_id: FLD-HP-4001
service_type: Field Service
site_address: Al Qurum, Office 204
shelf_location: NULL  ← Important! Not saved for Field Service
status: RECEIVED
```

---

## Counter Verification

### **Test 17: Check Current Counter Values**

**After completing all tests above, run:**

```sql
SELECT * FROM job_sequences ORDER BY category;
```

**Expected Result:**
```
Category | Base  | Current | Year
---------|-------|---------|------
FLD      | 4000  | 4004    | 2026
GEN      | 6000  | 6002    | 2026
HP       | 3000  | 3002    | 2026
HPP      | 2000  | 2001    | 2026
LEN      | 1000  | 1002    | 2026
OOW      | 5000  | 5003    | 2026
```

**Why:** Matches the number of jobs created in each category

---

## Yearly Reset Test (Simulation)

### **Test 18: Manual Year Reset Simulation**

**Purpose:** Verify January 1st auto-reset logic

**IMPORTANT:** This test requires temporarily deleting jobs to avoid UNIQUE constraint violations.

**Steps:**
1. **Save current job IDs for reference:**
   ```sql
   SELECT smart_job_id, retailer_name FROM jobs ORDER BY created_at;
   ```

2. **Temporarily delete all jobs (we'll verify counters only):**
   ```sql
   DELETE FROM jobs;
   ```

3. **Simulate year change:**
   ```sql
   UPDATE job_sequences SET last_reset_year = 2025;
   ```

4. **Create a new Lenovo Laptop job via the UI:**
   - In Warranty, Depot, Lenovo, Laptop
   - Shelf: LEN-TEST

5. **Check if reset worked:**
   ```sql
   SELECT * FROM job_sequences WHERE category = 'LEN';
   ```

**Expected Result:**
- ✅ `current_val` = 1001 (reset to base_series + 1)
- ✅ `last_reset_year` = 2026 (updated to current year)
- ✅ Job ID = `LEN-1001` (fresh counter)
- ✅ Job saved successfully

6. **Verify all counters were reset:**
   ```sql
   SELECT category, current_val, base_series, last_reset_year 
   FROM job_sequences 
   ORDER BY category;
   ```

**Expected:** All categories show `last_reset_year = 2026`

7. **Alternative: Test without deleting jobs (safer for production testing):**
   ```sql
   -- Don't actually run this in UI, just verify the function logic
   SELECT generate_smart_job_id('In Warranty', 'Depot', 'Lenovo', 'Laptop') as simulated_id;
   
   -- Check that year was updated even though job wasn't created
   SELECT last_reset_year FROM job_sequences WHERE category = 'LEN';
   ```
   
   Expected: `last_reset_year = 2026` (proves the reset logic runs)

---

## Summary Checklist

After completing all tests, verify:

- [ ] All 6 priority levels work correctly
- [ ] Priority order enforced (1 > 2 > 3 > 4 > 5 > 6)
- [ ] Field Service format: `FLD-BRAND-####`
- [ ] Other formats: `CATEGORY-####`
- [ ] Counters increment atomically
- [ ] Depot shows Shelf Location (amber)
- [ ] Field Service shows Site Address (blue)
- [ ] OOW overrides everything
- [ ] Field Service overrides brand logic
- [ ] Consumer vs Commercial Printer distinction works
- [ ] Database stores correct columns based on service type
- [ ] Draft → Received transition preserves data
- [ ] Yearly reset mechanism functional

---

## Expected Final Job IDs (After All Tests)

| Test # | Scenario | Expected ID |
|--------|----------|-------------|
| 1 | OOW HP Laptop | `OOW-5001` |
| 2 | OOW Field Lenovo | `OOW-5002` |
| 3 | Field HP | `FLD-HP-4001` |
| 4 | Field Lenovo | `FLD-LEN-4002` |
| 5 | Field Dell | `FLD-DELL-4003` |
| 6 | HP Consumer Printer | `HPP-2001` |
| 7 | HP Commercial Printer | `HP-3001` |
| 8 | HP Laptop | `HP-3002` |
| 9 | Lenovo Laptop | `LEN-1001` |
| 10 | Dell Laptop | `GEN-6001` |
| 11 | Acer Desktop | `GEN-6002` |
| 12 | OOW HP Consumer Printer | `OOW-5003` |
| 13 | Field HP Consumer Printer | `FLD-HP-4004` |
| 14 | Draft → Lenovo | `LEN-1002` |

**Total Jobs Created:** 14  
**Total Unique Categories Used:** 6

---

## Troubleshooting

### Issue: Job ID not generating
**Check:**
- Database function exists: `SELECT * FROM pg_proc WHERE proname = 'generate_smart_job_id';`
- Sequences table populated: `SELECT * FROM job_sequences;`

### Issue: Wrong priority assigned
**Check:**
- Exact spelling of warranty_status ("In Warranty" vs "In-Warranty")
- Service type exact match ("Field Service" not "field service")
- Device type exact match ("Consumer Printer" not "consumer printer")

### Issue: Site Address not saving
**Check:**
- Service Type = "Field Service"
- Column exists: `SELECT site_address FROM jobs LIMIT 1;`

### Issue: UI fields not toggling
**Check:**
- Browser console for React errors
- formData.service_type value in React DevTools
