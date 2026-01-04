# Database Schema Update - Engineer Assignment

## Required Columns for Engineer Assignment Feature

### Missing Columns to Add in Supabase:

1. **assigned_engineer_name** (text, nullable)
   - Stores the engineer's full name for display
   - Example: "Ahmed Al-Mansouri"
   
2. **date_assigned** (timestamp with timezone, nullable)
   - Records when the job was assigned
   - Used for SLA tracking

### How to Add These Columns in Supabase:

#### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to Supabase Dashboard
2. Click on "SQL Editor" in left sidebar
3. Click "New Query"
4. Paste this SQL:

```sql
-- Add assigned_engineer_name column
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS assigned_engineer_name TEXT;

-- Add date_assigned column
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS date_assigned TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN jobs.assigned_engineer_name IS 'Full name of assigned engineer for display';
COMMENT ON COLUMN jobs.date_assigned IS 'Timestamp when job was assigned to engineer';
```

5. Click "Run" (or press Ctrl+Enter)
6. Verify success message

#### Option 2: Using Supabase Table Editor

1. Go to Supabase Dashboard → Table Editor
2. Select "jobs" table
3. Click "Add Column" (+ icon)
4. Add first column:
   - Name: `assigned_engineer_name`
   - Type: `text`
   - Default value: (leave empty)
   - Is nullable: ✓ Yes
5. Click "Save"
6. Repeat for second column:
   - Name: `date_assigned`
   - Type: `timestamptz`
   - Default value: (leave empty)
   - Is nullable: ✓ Yes
7. Click "Save"

### Verification Query:

Run this to verify columns were added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND column_name IN ('assigned_engineer_name', 'date_assigned');
```

Expected output:
```
column_name              | data_type                    | is_nullable
-------------------------+------------------------------+-------------
assigned_engineer_name   | text                         | YES
date_assigned            | timestamp with time zone     | YES
```

### After Adding Columns:

The Engineer Assignment UI will work fully:
- Frontend will save both ID and name
- Date tracking will enable SLA alerts
- Assignment history will be preserved

**Status:** Columns need to be added manually in Supabase Dashboard
