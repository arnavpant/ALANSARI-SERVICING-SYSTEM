"""
Generate SQL to fix assigned_engineer_id column type
"""

SQL = """
-- Fix assigned_engineer_id column type
-- Currently: UUID (expects foreign key to users table we don't have)
-- Change to: TEXT (allows simple string IDs like "ENG001")

ALTER TABLE jobs 
ALTER COLUMN assigned_engineer_id TYPE TEXT;
"""

print("="*70)
print("⚠️  DATABASE FIX REQUIRED")
print("="*70)
print("\n📋 ISSUE:")
print("The 'assigned_engineer_id' column is type UUID, but we're using")
print("simple string IDs like 'ENG001' (we don't have a users table yet).")
print("\n📋 SOLUTION:")
print("Change the column type from UUID to TEXT")
print("\n" + "="*70)
print("SQL TO RUN IN SUPABASE:")
print("="*70)
print(SQL)
print("="*70)
print("\n📋 INSTRUCTIONS:")
print("1. Go to https://supabase.com/dashboard")
print("2. Open SQL Editor")
print("3. Copy the SQL above")
print("4. Run it")
print("5. Run: python test_full_assignment_integration.py")
print("="*70)

with open("FIX_ENGINEER_ID_COLUMN.sql", "w") as f:
    f.write(SQL)

print("\n✅ SQL saved to: FIX_ENGINEER_ID_COLUMN.sql\n")
