# Forgot Password Setup Guide

## Overview
The forgot password functionality is already implemented in the Login screen. Users can click "Forgot password?" to receive a password reset email.

## Supabase Email Template Configuration

### Step 1: Enable Email Confirmation in Supabase
1. Go to **Supabase Dashboard → Authentication → Settings**
2. Scroll to **Email Templates**
3. Find the **"Reset Password"** template

### Step 2: Customize Reset Password Email (Optional)
The default template works fine, but you can customize it:

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password for Al Ansari Service System:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, please ignore this email.</p>
```

### Step 3: Configure Site URL
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to: `http://localhost:5174` (for development)
3. When deployed, change to your production URL (e.g., `https://alansari-service.vercel.app`)

### Step 4: Add Redirect URLs
1. In **URL Configuration**, find **Redirect URLs**
2. Add these URLs:
   - `http://localhost:5174/reset-password` (development)
   - `https://your-production-domain.com/reset-password` (production)

## How It Works

### User Flow:
1. User clicks **"Forgot password?"** on login screen
2. Enters their email address
3. Clicks **"Send Reset Link"**
4. Receives email from Supabase with reset link
5. Clicks link → Redirected to `/reset-password` page
6. Enters new password
7. Redirected back to login

## Current Implementation Status

✅ **Frontend Implementation:**
- "Forgot password?" link on login screen
- Dedicated password reset form
- Email validation
- Error handling (user not found vs system error)
- Success notification

⚠️ **Missing Component:**
- `/reset-password` page (where user enters new password)
  - This page needs to be created to complete the flow
  - It should read the token from URL and call `supabase.auth.updateUser()`

## Testing

### Test Forgot Password Flow:
1. Click "Forgot password?" on login screen
2. Enter: `admin@alansari.com`
3. Click "Send Reset Link"
4. Check your email inbox
5. Click the link in the email
6. (Currently will show 404 - need to create /reset-password page)

### Expected Behavior:
- ✅ Valid email → "Password reset email sent! Check your inbox."
- ❌ Invalid email → "Email address not found. Please check and try again."
- ❌ System error → "System error. Please try again later or contact support."

## Next Steps (If Needed)

If you want the full password reset flow, we need to create:
1. A `ResetPassword.jsx` component
2. A route in the router (or handle it in App.jsx)
3. Logic to extract token from URL and update password

**For MVP:** The current implementation is sufficient - emails are sent successfully, and users can reset via Supabase dashboard if needed.
