# Business Hours Email Processing - Edge Cases

## 🕐 Operating Hours
- **Active:** 7:00 AM - 6:00 PM Oman Time (GMT+4)
- **Inactive:** 6:00 PM - 7:00 AM + Weekends (optional)

---

## 📋 Edge Cases & Solutions

### Case 1: Overnight Emails
**Scenario:** Email arrives at 8:00 PM (office closed)  
**Expected Behavior:** Processed at 7:00 AM next morning  
**Solution:** On startup, check emails from last 7 days (not just "today")  
**Status:** ✅ Will implement

### Case 2: Weekend Emails
**Scenario:** Email arrives Saturday 3:00 PM  
**Expected Behavior:** Processed Monday 7:00 AM  
**Solution:** Same as Case 1 - check last 7 days on startup  
**Status:** ✅ Will implement

### Case 3: Multiple Overnight Emails
**Scenario:** 5 emails arrive between 8 PM - 6 AM  
**Expected Behavior:** All 5 processed at 7:00 AM startup  
**Solution:** Loop through ALL unread emails from last 7 days  
**Deduplication:** Prevents re-processing if server restarts during day  
**Status:** ✅ Will implement

### Case 4: Email Arrives at 5:59 PM (1 min before shutdown)
**Scenario:** Email arrives just before server goes down  
**Expected Behavior:** 
  - If server is still running: Process immediately
  - If server just shut down: Process at 7 AM next day
**Solution:** Current 60-second loop handles this naturally  
**Status:** ✅ Already works

### Case 5: Server Crash During Day
**Scenario:** Server crashes at 2:00 PM, restarts at 2:30 PM  
**Expected Behavior:** Process any emails from 2:00-2:30 PM gap  
**Solution:** Check last 7 days on EVERY startup (not just morning)  
**Status:** ✅ Will implement

### Case 6: Same Email Sent Twice (Different Days)
**Scenario:** 
  - Monday: Email with subject "HP Laptop Repair"
  - Tuesday: SAME email forwarded again (same subject, same sender)
**Expected Behavior:** Create TWO jobs (different dates)  
**Solution:** Deduplication checks email_source_id (unique Message-ID)  
**Status:** ✅ Already works

### Case 7: Duplicate Check During Restart
**Scenario:** Server processes email at 7:05 AM, restarts at 7:10 AM  
**Expected Behavior:** Don't re-process the 7:05 AM email  
**Solution:** email_source_id prevents duplicates  
**Status:** ✅ Already works

### Case 8: Gmail Promotions/Spam Folder
**Scenario:** Email goes to Promotions instead of Primary  
**Expected Behavior:** NOT processed (only Primary inbox matters)  
**Solution:** Gmail filter: `category:primary`  
**Status:** ✅ Already configured

### Case 9: Very Old Unread Email
**Scenario:** Unread email from 2 months ago still in inbox  
**Expected Behavior:** Don't process ancient emails  
**Solution:** Change from "unread only" to "unread + last 7 days"  
**Status:** ✅ Will implement

### Case 10: Timezone Issues
**Scenario:** Server deployed on US server (different timezone)  
**Expected Behavior:** Follow Oman time (GMT+4) regardless of server location  
**Solution:** Use Render's cron jobs with explicit timezone OR manage in code  
**Status:** ✅ Will implement

---

## 🛠️ Implementation Plan

### Step 1: Update Email Fetch Logic
**Current:** `is:unread after:{today}`  
**New:** `is:unread after:{7_days_ago}`  

### Step 2: Add Startup Email Burst
- On server startup → Immediately check emails
- Process ALL unread from last 7 days
- Then continue 60-second loop

### Step 3: Configure Render Cron (Deployment)
- Use Render's native cron schedule
- Set to Oman timezone (GMT+4)
- Start: 7:00 AM, Stop: 6:00 PM

### Step 4: Update UptimeRobot
- Only ping during business hours (7 AM - 6 PM Oman time)
- OR skip UptimeRobot entirely (server runs on schedule)

---

## ✅ Testing Checklist

- [ ] Test overnight email processing
- [ ] Test weekend email processing  
- [ ] Test multiple emails in queue
- [ ] Test deduplication on restart
- [ ] Test 7-day lookback window
- [ ] Test timezone handling
- [ ] Verify no duplicates created
- [ ] Confirm ancient emails ignored

---

## 📊 Expected Behavior Summary

| Time | Email Arrives | When Processed | Method |
|------|---------------|----------------|--------|
| 9:00 AM | ✅ Server running | Immediately (within 60s) | Normal loop |
| 8:00 PM | ❌ Server off | Next day 7:00 AM | Startup check |
| Saturday | ❌ Server off | Monday 7:00 AM | Startup check |
| 5:59 PM | ⚠️ Server shutting down | Immediately OR 7:00 AM | Loop or startup |
| During crash | ⚠️ Temporary outage | On restart | Startup check |

**Key Principle:** The 7-day lookback window ensures ZERO emails are missed, ever.
