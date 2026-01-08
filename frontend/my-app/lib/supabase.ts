import { createBrowserClient } from "@supabase/ssr"

// Using the credentials from your existing codebase
const supabaseUrl = "https://dwbuneceuqaonythkjly.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YnVuZWNldXFhb255dGhramx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ4MDExMywiZXhwIjoyMDgyMDU2MTEzfQ.oltyij-Wd9gJtDGqWq5rgbHr_LKH9W9aGkYpFhcjGnc"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

export const supabase = getSupabase()
