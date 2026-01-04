"""
Create Engineers Table in Supabase
This allows admins to manage engineers without touching code
"""

SQL = """
-- Create Engineers Table
CREATE TABLE IF NOT EXISTS engineers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add initial engineers
INSERT INTO engineers (id, name, email, status) VALUES
  ('ENG1', 'Engineer 1', 'engineer1@alansari.om', 'active'),
  ('ENG2', 'Engineer 2', 'engineer2@alansari.om', 'active'),
  ('ENG3', 'Engineer 3', 'engineer3@alansari.om', 'active'),
  ('ENG4', 'Engineer 4', 'engineer4@alansari.om', 'active')
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT * FROM engineers ORDER BY id;
"""

print("="*70)
print("CREATE ENGINEERS TABLE")
print("="*70)
print("\n📋 INSTRUCTIONS:")
print("1. Go to https://supabase.com/dashboard")
print("2. Open SQL Editor")
print("3. Copy the SQL below")
print("4. Run it")
print("\n" + "="*70)
print("SQL TO RUN:")
print("="*70)
print(SQL)
print("="*70)
print("\n✅ This creates the 'engineers' table with 4 initial engineers")
print("✅ Admin can add more engineers via Supabase Table Editor")
print("✅ Frontend will auto-fetch engineers from this table")
print("\n💡 To add more engineers later:")
print("   1. Go to Supabase → Table Editor → engineers")
print("   2. Click 'Insert Row'")
print("   3. Fill in: id (ENG5), name, email, status (active)")
print("   4. Frontend dropdown will show the new engineer automatically!")
print("="*70)
