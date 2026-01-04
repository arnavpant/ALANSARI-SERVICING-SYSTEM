"""
MANUAL STEP REQUIRED: Add Database Columns

This script shows you the SQL to run in Supabase Dashboard.
We cannot run this automatically - you must do it manually.

Instructions:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL below
6. Click "Run" or press Ctrl+Enter
"""

SQL_TO_RUN = """
-- Add assigned_engineer_name column
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS assigned_engineer_name TEXT;

-- Add date_assigned column
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS date_assigned TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN jobs.assigned_engineer_name IS 'Full name of assigned engineer for display';
COMMENT ON COLUMN jobs.date_assigned IS 'Timestamp when job was assigned to engineer';
"""

print("="*70)
print("⚠️  MANUAL DATABASE MIGRATION REQUIRED")
print("="*70)
print("\n📋 STEP-BY-STEP INSTRUCTIONS:\n")
print("1. Open your browser and go to: https://supabase.com/dashboard")
print("2. Log in and select your project: dwbuneceuqaonythkjly")
print("3. Click 'SQL Editor' in the left sidebar")
print("4. Click 'New Query' button")
print("5. Copy the SQL below and paste it into the editor:")
print("\n" + "="*70)
print("SQL TO COPY AND RUN:")
print("="*70)
print(SQL_TO_RUN)
print("="*70)
print("\n6. Click the 'Run' button (or press Ctrl+Enter)")
print("7. You should see: 'Success. No rows returned'")
print("8. Come back here and run: python test_engineer_assignment.py")
print("   to verify the columns were added\n")
print("="*70)
print("💡 WHY MANUAL?")
print("="*70)
print("Supabase doesn't allow schema changes via the REST API for safety.")
print("This prevents accidental table modifications in production.")
print("="*70)

# Save SQL to file for easy copy-paste
with open("ADD_COLUMNS.sql", "w") as f:
    f.write(SQL_TO_RUN)

print("\n✅ SQL also saved to: ADD_COLUMNS.sql")
print("   You can open this file and copy from there too.\n")
