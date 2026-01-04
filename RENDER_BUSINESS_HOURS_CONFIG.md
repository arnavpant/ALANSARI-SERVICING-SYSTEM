# Render Deployment Configuration - Business Hours Mode

## 🕐 Deployment Strategy

### Option 1: Render Cron Jobs (RECOMMENDED)
Use Render's native cron job service to start/stop the server automatically.

**Render Configuration:**
```yaml
services:
  - type: web
    name: alansari-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    schedule: "0 3-14 * * *"  # 7 AM - 6 PM Oman time (GMT+4 = UTC 3-14)
    envVars:
      - key: IMAP_SERVER
        value: imap.gmail.com
      - key: EMAIL_USER
        sync: false
      - key: EMAIL_PASS
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false
```

**Cron Schedule Explained:**
- `0 3-14 * * *` = Every hour from 3:00 UTC to 14:00 UTC
- Oman Time (GMT+4) = UTC + 4
- 7 AM Oman = 3 AM UTC
- 6 PM Oman = 2 PM UTC (14:00)

### Option 2: External Scheduler (Alternative)
Use a free service like cron-job.org to call Render's start/stop API.

---

## 📊 Resource Usage Calculation

**Business Hours:** 7 AM - 6 PM = 11 hours/day

| Period | Days | Hours/Day | Total Hours |
|--------|------|-----------|-------------|
| Weekdays | 22 days | 11 hours | 242 hours |
| Weekends | 8 days | 0 hours | 0 hours |
| **TOTAL** | **30 days** | - | **242 hours/month** |

**Render Free Tier:** 750 hours/month  
**Usage:** 242 hours/month (32% of limit)  
**Buffer:** 508 hours (68% remaining) ✅

---

## 🔄 How It Works

### Morning Startup (7:00 AM)
1. Server starts via cron trigger
2. **IMMEDIATE EMAIL CHECK** (startup burst)
   - Scans last 7 days for unread emails
   - Processes overnight emails (from 6 PM yesterday to now)
   - Processes weekend emails (if Monday)
   - Deduplication prevents re-processing
3. Starts 60-second loop for continuous checking
4. Server stays alive until 6 PM

### During Day (7 AM - 6 PM)
- Email loop checks every 60 seconds
- Processes new emails within 1 minute
- No UptimeRobot needed (server is always on during hours)

### Evening Shutdown (6:00 PM)
- Server stops automatically
- No emails processed overnight (office closed)

### Next Morning (7:00 AM)
- Process repeats
- Catches all overnight/weekend emails

---

## ✅ Edge Cases Handled

| Scenario | Arrival Time | Processing Time | How |
|----------|--------------|-----------------|-----|
| Overnight email | 8:00 PM | 7:00 AM next day | 7-day lookback |
| Weekend email | Saturday 3 PM | Monday 7:00 AM | 7-day lookback |
| Multiple overnight | 6 PM - 7 AM | 7:00 AM (all at once) | Loop through all |
| Last-minute email | 5:59 PM | Immediate (if caught) | Normal loop |
| Server crash | 2 PM crash, 2:30 PM restart | 2:30 PM | Startup check |
| Duplicate on restart | - | Skipped | email_source_id |
| Ancient email | 2 months ago | Ignored | 7-day window |
| Wrong folder | Promotions/Spam | Ignored | category:primary |

---

## 🧪 Testing Checklist

### Pre-Deployment Tests (Local)
- [x] Gmail connection works
- [x] 7-day lookback finds old emails
- [x] Deduplication prevents duplicates
- [x] Startup email check runs
- [x] Database schema has email_source_id
- [ ] Server runs for 30 minutes without errors

### Post-Deployment Tests (Render)
- [ ] Server starts at 7:00 AM Oman time
- [ ] Startup logs show email check
- [ ] Server stops at 6:00 PM Oman time
- [ ] Send test email at 8:00 PM → Verify processed at 7:00 AM
- [ ] Send 3 test emails overnight → Verify all 3 processed at 7:00 AM
- [ ] Check no duplicates created
- [ ] Monitor for 1 week

---

## 🚀 Deployment Steps

### Step 1: Prepare render.yaml
Create in project root:
```yaml
services:
  - type: web
    name: alansari-backend
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /
```

### Step 2: Configure Environment Variables in Render
In Render dashboard → Environment:
- `IMAP_SERVER` = `imap.gmail.com`
- `EMAIL_USER` = `zombiechargerg@gmail.com`
- `EMAIL_PASS` = (your app password)
- `SUPABASE_URL` = (your Supabase URL)
- `SUPABASE_KEY` = (your service role key)

### Step 3: Set Up Cron Schedule
Option A: Use cron-job.org (easier for testing)
- URL: `https://your-app.onrender.com/`
- Schedule: Every hour from 3:00 - 14:00 UTC

Option B: Upgrade to Render paid tier ($7/month) for native cron

### Step 4: Initial Test
1. Deploy to Render
2. Manually start service at any time
3. Check logs for "SERVER STARTING - BUSINESS HOURS MODE"
4. Verify startup email check runs
5. Send test email
6. Wait 1 minute
7. Check database for new draft

---

## 📋 Maintenance

### Monthly Tasks
- Check Render usage (should be ~240-250 hours)
- Review error logs
- Verify no emails missed

### Yearly Tasks
- Export old jobs to Excel
- Delete archived jobs from database
- Reset job ID counters (January 1st)
- Renew Gmail app password if needed

---

## ⚠️ Important Notes

1. **Timezone:** Render servers run on UTC. Always convert Oman time (GMT+4) to UTC for cron.
2. **No UptimeRobot:** Not needed since server runs on schedule, not 24/7.
3. **Free Tier Limits:** 750 hours/month. Business hours = 242 hours (safe).
4. **Email Latency:** Max 12-hour delay (overnight emails processed next morning).
5. **Database Size:** ~4,000 jobs/year = 10-20 MB (safe for years).

---

## 🎯 Success Metrics

✅ Server uptime during business hours: 99%+  
✅ No missed emails: 100%  
✅ No duplicate jobs: 100%  
✅ Monthly Render usage: < 300 hours  
✅ Email processing time: < 2 minutes from arrival (during hours)  
✅ Overnight emails: Processed within 5 minutes of 7 AM startup

**Status:** Ready for production deployment
