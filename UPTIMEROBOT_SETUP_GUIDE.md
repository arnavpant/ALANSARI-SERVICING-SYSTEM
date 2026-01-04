# UptimeRobot Setup Guide

## ✅ Health Endpoint Verified

**Endpoint:** `GET /`  
**Response:** `{"status":"running","message":"I am awake!"}`  
**Status:** Working correctly ✓

---

## 📋 Setup Instructions (For Module 5 Deployment)

### Step 1: Deploy to Render First
Before setting up UptimeRobot, you need your production URL from Render.
- Example: `https://alansari-backend.onrender.com`

### Step 2: Create UptimeRobot Account
1. Go to: https://uptimerobot.com
2. Click **"Sign Up Free"**
3. Enter email: (use your business email)
4. Verify email and log in

### Step 3: Add New Monitor
1. Click **"+ Add New Monitor"**
2. Fill in the form:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Al Ansari Backend
   URL: https://your-app-name.onrender.com/
   Monitoring Interval: 5 minutes
   ```
3. Click **"Create Monitor"**

### Step 4: Verify It's Working
1. Wait 5 minutes
2. Check the dashboard - should show "Up" with green status
3. Click on the monitor to see ping history

---

## 🎯 What This Does

- Pings your Render backend every 5 minutes
- Prevents Render free tier from spinning down (15-min inactivity limit)
- Keeps your email checker running 24/7
- Sends you alerts if the server goes down

---

## 📊 Expected Behavior

**UptimeRobot Dashboard:**
- Status: ✅ Up (99-100% uptime)
- Response Time: ~200-500ms
- Checked: Every 5 minutes

**Render Logs:**
- You'll see: `INFO: 127.0.0.1:XXXXX - "GET / HTTP/1.1" 200 OK` every 5 minutes
- This is NORMAL and expected

---

## ⚠️ Important Notes

1. **Do this AFTER deploying to Render** (Module 5)
2. **Don't use localhost URL** - UptimeRobot can't reach local servers
3. **Keep credentials safe** - UptimeRobot login = your monitoring dashboard
4. **Free tier limits:**
   - 50 monitors max (you only need 1)
   - 5-minute interval (perfect for Render)
   - Email alerts included

---

## ✅ Success Criteria

- [ ] UptimeRobot account created
- [ ] Monitor added with production Render URL
- [ ] Monitor shows "Up" status
- [ ] Render logs show GET / requests every 5 minutes
- [ ] Backend stays awake (no spin-downs)

**Status:** Ready for deployment (Module 5)
