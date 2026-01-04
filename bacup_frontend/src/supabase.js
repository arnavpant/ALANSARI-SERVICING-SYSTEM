// src/supabase.js
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION ---
// Paste these exactly as they appear in your backend .env file
const supabaseUrl = 'https://dwbuneceuqaonythkjly.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YnVuZWNldXFhb255dGhramx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ4MDExMywiZXhwIjoyMDgyMDU2MTEzfQ.oltyij-Wd9gJtDGqWq5rgbHr_LKH9W9aGkYpFhcjGnc' // It's safe to use the ANON key in frontend

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage
  }
})