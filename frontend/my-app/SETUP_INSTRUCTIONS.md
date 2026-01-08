# User Setup Instructions

## Quick Steps

### 1. Open Supabase SQL Editor
Go to: https://dwbuneceuqaonythkjly.supabase.co/project/dwbuneceuqaonythkjly/sql/new

### 2. Run SQL Files in Order

**First:** Copy and run `1_create_auth_users.sql`
- This creates the authentication accounts
- Password for all users: `admin`

**Second:** Copy and run `2_create_user_records.sql`
- This creates the user records with roles
- Links engineers to their accounts

### 3. Verify

The second script will show a verification table at the end. You should see:

| email | full_name | role | linked_engineer_id | auth_exists |
|-------|-----------|------|-------------------|-------------|
| admin@alansari.com | Admin User | Admin | NULL | ✓ |
| engineer1@alansari.com | Engineer One | Engineer | ENG1 | ✓ |
| engineer2@alansari.com | Engineer Two | Engineer | ENG2 | ✓ |
| frontdesk@alansari.com | Front Desk User | Front Desk | NULL | ✓ |

## Login Credentials

- **Admin:** admin@alansari.com / admin
- **Front Desk:** frontdesk@alansari.com / admin
- **Engineer 1:** engineer1@alansari.com / admin
- **Engineer 2:** engineer2@alansari.com / admin

## Engineers Already Created

✓ ENG1 - Engineer One
✓ ENG2 - Engineer Two

---

**Note:** If you get errors about users already existing, that's okay - the scripts use ON CONFLICT to update existing records.
