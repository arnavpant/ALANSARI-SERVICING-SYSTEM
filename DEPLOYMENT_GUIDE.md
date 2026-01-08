# 🚀 Al Ansari Service System - Deployment Guide

## 📋 Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [x] All environment variables documented
- [x] Dependencies listed in requirements.txt and package.json
- [x] render.yaml created
- [ ] Environment variables ready to copy
- [ ] Render account created
- [ ] Vercel account created

---

## 🔐 Environment Variables Reference

### Backend (Render) - 5 Variables

```bash
IMAP_SERVER=imap.gmail.com
EMAIL_USER=your-service-account@gmail.com
EMAIL_PASS=your-16-character-app-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

**Where to get these:**
- `EMAIL_USER` & `EMAIL_PASS`: Gmail account with App Password enabled (https://myaccount.google.com/apppasswords)
- `SUPABASE_URL` & `SUPABASE_KEY`: Supabase Dashboard → Project Settings → API

### Frontend (Vercel) - 2 Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

**Same values as backend Supabase credentials**

---

## 📦 STEP 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account (easiest)

### 1.2 Deploy Backend
1. Dashboard → **New** → **Web Service**
2. Connect GitHub repository: `ALANSARI`
3. Configuration:
   - **Name:** `alansari-backend`
   - **Region:** Singapore (closest to Oman)
   - **Branch:** `main`
   - **Root Directory:** Leave blank (render.yaml will handle this)
   - **Runtime:** Python 3
   - **Build Command:** Auto-detected from render.yaml
   - **Start Command:** Auto-detected from render.yaml
   - **Plan:** Free

### 1.3 Add Environment Variables
In Render dashboard → Environment:

```
IMAP_SERVER = imap.gmail.com
EMAIL_USER = [YOUR GMAIL HERE]
EMAIL_PASS = [YOUR APP PASSWORD HERE]
SUPABASE_URL = [YOUR SUPABASE URL]
SUPABASE_KEY = [YOUR SUPABASE ANON KEY]
```

**⚠️ IMPORTANT:** Click "Save Changes" after adding all 5 variables

### 1.4 Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes for build
- Check logs for "Application startup complete"
- Copy the URL: `https://alansari-backend.onrender.com`

### 1.5 Test Backend
Visit: `https://alansari-backend.onrender.com/`

Should see:
```json
{"message": "Al Ansari Email Watcher is Running"}
```

---

## 🌐 STEP 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub account

### 2.2 Import Project
1. Dashboard → **Add New** → **Project**
2. Import Git Repository: `ALANSARI`
3. Configuration:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend/my-app`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

### 2.3 Add Environment Variables
In Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = [YOUR SUPABASE URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [YOUR SUPABASE ANON KEY]
```

### 2.4 Deploy
- Click **Deploy**
- Wait 2-3 minutes for build
- Copy the URL: `https://alansari-system.vercel.app`

### 2.5 Test Frontend
1. Visit your Vercel URL
2. Try logging in with your Supabase credentials
3. Check if data loads from database

---

## ⏰ STEP 3: Configure Business Hours Keep-Alive (cron-job.org)

**Why needed:** Render free tier sleeps after 15 min of inactivity. This keeps it awake during business hours.

### 3.1 Create Account
1. Go to https://cron-job.org/en/signup.php
2. Sign up (free tier: 50 jobs, 1-min intervals)

### 3.2 Create Cron Job
1. Dashboard → **Create Cronjob**
2. Configuration:

```
Title: Al Ansari Backend Keep-Alive
URL: https://alansari-backend.onrender.com/
Schedule Type: Advanced (every X minutes)
Every: 5 minutes
Time Range: 07:00 - 18:00
Days: Monday, Tuesday, Wednesday, Thursday, Friday
Timezone: Asia/Muscat (GMT+4)
```

3. Click **Create**

### 3.3 Verify
- Wait 5 minutes
- Check **Execution log** - should show successful pings
- Check Render logs - should show `GET /` requests every 5 min

**Result:** Backend runs 7 AM - 6 PM Mon-Fri (11 hours × 22 days = 242 hours/month, well under 750-hour free limit)

---

## ✅ STEP 4: End-to-End Testing

### Test 1: Email Intake
1. Send test email to `EMAIL_USER` address
2. Wait 60 seconds (email check interval)
3. Check frontend → Drafts tab
4. Should see new job with status `DRAFT_FROM_EMAIL`

### Test 2: Full Workflow
1. Process draft → Unit Collection Form → RECEIVED
2. Assign to engineer → ASSIGNED
3. Engineer → Diagnosis → Add Parts (or No Parts) → WAITING_FOR_PARTS / READY_FOR_REPAIR
4. Mark parts ARRIVED → READY_FOR_REPAIR
5. Complete Job → COMPLETED
6. Admin → Close Job (with signed_dn) → CLOSED

### Test 3: Deduplication
1. Send same email twice
2. Second instance should be skipped (check backend logs)
3. Only one job created

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** "Application failed to start"
- Check Render logs for Python errors
- Verify all 5 environment variables are set
- Check `requirements.txt` has all dependencies

**Problem:** "Email watcher not processing emails"
- Check Gmail App Password is correct (16 characters, no spaces)
- Verify `EMAIL_USER` matches the Gmail account
- Check Render logs for IMAP connection errors

**Problem:** "Server goes to sleep even with cron job"
- Verify cron-job.org execution log shows successes
- Check timezone is set to Asia/Muscat (GMT+4)
- Ensure cron job runs every 5 minutes (not longer intervals)

### Frontend Issues

**Problem:** "Module not found" errors during build
- Run `npm install` in `frontend/my-app` locally
- Check all imports are correct
- Verify `package.json` has all dependencies

**Problem:** "Cannot connect to Supabase"
- Check environment variables start with `NEXT_PUBLIC_`
- Verify Supabase URL and Key are correct
- Redeploy after adding environment variables

**Problem:** "Login not working"
- Check Supabase Auth is enabled
- Verify users exist in Supabase Auth dashboard
- Check browser console for errors

---

## 📊 Free Tier Limits

### Render (Backend)
- ✅ 750 hours/month free
- ✅ Business hours = ~242 hours/month (well within limit)
- ⚠️ Server sleeps after 15 min inactivity (solved with cron job)
- ⚠️ Slow cold starts (~30 seconds first load)

### Vercel (Frontend)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Always-on (no sleeping)
- ✅ Fast global CDN

### cron-job.org
- ✅ 50 cron jobs free
- ✅ 1-minute minimum interval
- ✅ Unlimited executions

---

## 🎯 Post-Deployment Checklist

- [ ] Backend URL accessible: `https://alansari-backend.onrender.com/`
- [ ] Frontend URL accessible: `https://alansari-system.vercel.app`
- [ ] Login works with real credentials
- [ ] Test email creates draft job
- [ ] Full workflow completes successfully
- [ ] Cron job keeps backend awake during business hours
- [ ] No errors in Render logs
- [ ] No errors in Vercel build logs

---

## 🔄 Updating After Deployment

### Update Backend Code
1. Push to GitHub: `git push origin main`
2. Render auto-deploys (watch logs)
3. Wait ~2 minutes for new version

### Update Frontend Code
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys
3. Wait ~1 minute for new version

**No manual deployment needed - both platforms auto-deploy on git push!**

---

## 📞 Support

**Render Status:** https://status.render.com  
**Vercel Status:** https://www.vercel-status.com  
**Supabase Status:** https://status.supabase.com

**Estimated Total Setup Time:** 30-45 minutes
