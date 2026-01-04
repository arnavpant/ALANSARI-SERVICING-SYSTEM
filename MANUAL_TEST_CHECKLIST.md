# 📋 MANUAL FRONTEND TEST CHECKLIST

**Tester:** Arnav Pant  
**Date:** December 27th, 2025  
**Frontend URL:** http://localhost:5173  
**Test Account:** admin@alansari.com

---

## 🎯 PRE-TEST SETUP

- [x] Frontend running (`npm run dev`)
- [x] Logged in as admin@alansari.com
- [x] Browser console open (F12) to check for errors
- [x] At least 1 test job with COMPLETED status exists

---

## TEST 1: Job Disappears from Active Jobs After Closing

**Steps:**
1. Go to **Active Jobs** tab
2. Find a job with status **COMPLETED**
3. Note the Job ID: ________________
4. Click purple **Close Job** button (PackageCheck icon)
5. Confirm in the Close Job Modal
6. Wait for success toast

**Expected Results:**
- [X] Success toast appears: "Job closed and handed over"
- [X] Job **disappears** from Active Jobs list immediately
- [X] Job count in tab decreases by 1
- [X] No console errors

**Actual Result:** PASS

**Notes:** _________________________________________________

---

## TEST 2: Closed Job Appears in Closed Jobs Tab

**Steps:**
1. Go to **Closed Jobs** tab
2. Search for the Job ID from Test 1: ________________
3. Verify job details displayed correctly
4. Check closed_at timestamp shows

**Expected Results:**
- [x] Job appears in Closed Jobs table
- [x] Status shows as **CLOSED**
- [x] Closed date shows (e.g., "5 minutes ago")
- [x] Green "Generate Delivery Note" button visible

**Actual Result:** PASS

**Notes:** _________________________________________________

---

## TEST 3: Long Retailer Name - Text Overflow Handling

**Steps:**
1. Go to **Drafts** tab
2. Process a draft (or create manually in Database Viewer)
3. Set Retailer Name to: "Super Long Electronics International Trading Company LLC LLC LLC"
4. Save and view in Active Jobs

**Expected Results:**
- [ ] Text truncates gracefully (ellipsis ...) OR
- [ ] Text wraps to multiple lines without breaking layout
- [ ] No horizontal scrolling in table
- [ ] Other columns remain visible

**Actual Result:** ☐ PASS  ☐ FAIL

**Notes:** Doesnt ask to input retailer name when clicking processing, need to fix this!

---

## TEST 4: Job with 10+ Parts - Modal Scrolling

**Steps:**
1. Create a test job (or use existing)
2. Go to **Engineer View** tab
3. Add 10 parts to the same job (use "Add Part" button repeatedly)
4. Click **Complete Job** button (purple)
5. Observe Completion Modal

**Expected Results:**
- [x] Modal opens successfully
- [x] All 10 parts visible in scrollable list
- [x] Can scroll through all parts smoothly
- [x] Input fields for each part accessible
- [x] Modal footer (Complete/Cancel buttons) always visible
- [x] No layout breaking

**Actual Result:** PASS

**Notes:** _________________________________________________

---

## TEST 5: Rapid Button Clicking - Double Submission Prevention

### Test 5A: Complete Job Button

**Steps:**
1. Go to **Engineer View**
2. Find a job with parts in ARRIVED status
3. Click **Complete Job** button
4. In modal, fill in old part details
5. **Rapidly click "Complete Repair" button 5 times** (fast double-clicks)
6. Check Database Viewer → Old Parts table

**Expected Results:**
- [X] Button disables after first click OR
- [X] Loading state shows after first click
- [X] Only **ONE** old_part record created per part (not duplicates)
- [X] No duplicate job completion

**Actual Result:** Pass

**Notes:** _________________________________________________

### Test 5B: Close Job Button

**Steps:**
1. Go to **Active Jobs** tab
2. Find COMPLETED job
3. Click **Close Job** button
4. In modal, **rapidly click "Confirm Handover & Close" 5 times**
5. Check if job status updated multiple times

**Expected Results:**
- [x] Button disables after first click
- [x] Only one update request sent
- [x] Job status = CLOSED (not multiple updates)
- [x] closed_at timestamp only set once

**Actual Result:** PASS

**Notes:** _________________________________________________

---

## TEST 6: Network Timeout Simulation (BONUS)

**Setup:** Open Browser DevTools → Network Tab → Throttling → Offline

**Steps:**
1. Fill out Unit Collection Form
2. Enable **Offline mode** in DevTools
3. Click Save
4. Observe behavior

**Expected Results:**
- [x] Error toast appears (e.g., "Failed to save")
- [x] Form data not lost
- [x] User can retry after reconnecting
- [x] No infinite loading state

**Actual Result:**PASS

**Notes:** _________________________________________________



