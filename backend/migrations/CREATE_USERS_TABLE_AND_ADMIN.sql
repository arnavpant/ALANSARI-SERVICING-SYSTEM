-- =====================================================
-- MODULE 3.5: AUTHENTICATION & AUTHORIZATION
-- Task: Create Users Table and Bootstrap First Admin
-- =====================================================

-- Step 1: Create the users table to store role information
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Front Desk', 'Engineer')),
    linked_engineer_id TEXT REFERENCES engineers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policy - Users can read their own data
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Step 4: Create RLS policy - Only admins can view all users
CREATE POLICY "Admins can view all users"
    ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Step 5: Create RLS policy - Only admins can insert new users
CREATE POLICY "Admins can create users"
    ON public.users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Step 6: Create RLS policy - Only admins can update users
CREATE POLICY "Admins can update users"
    ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- =====================================================
-- BOOTSTRAP FIRST ADMIN ACCOUNT
-- =====================================================
-- NOTE: This section must be run MANUALLY by you in Supabase Dashboard
-- because it requires admin privileges to create auth users.
-- 
-- TO CREATE THE FIRST ADMIN:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" button
-- 3. Enter:
--    - Email: admin@alansari.com
--    - Password: [Choose a secure password]
--    - Auto Confirm User: YES (check this box)
-- 4. Click "Create User"
-- 5. Copy the User ID that was generated
-- 6. Run this query in SQL Editor (replace YOUR_ADMIN_USER_ID):

/*
INSERT INTO public.users (id, email, full_name, role)
VALUES (
    'YOUR_ADMIN_USER_ID'::UUID,  -- Replace with the UUID from step 5
    'admin@alansari.com',
    'System Administrator',
    'Admin'
);
*/

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the admin account was created successfully:
-- SELECT u.email, u.full_name, u.role, u.created_at
-- FROM public.users u
-- WHERE u.role = 'Admin';
