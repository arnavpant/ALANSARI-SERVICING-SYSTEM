-- =====================================================
-- FIX: Row Level Security Infinite Recursion Issue
-- =====================================================

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can create users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- Step 2: Create simple, non-recursive policies

-- Allow users to read their own profile (needed for login)
CREATE POLICY "users_select_own"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow authenticated users to read all user profiles
-- (We'll control admin-only actions in the frontend)
CREATE POLICY "users_select_authenticated"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- Only allow INSERT if the authenticated user already has Admin role
-- (This will work after the first admin is bootstrapped)
CREATE POLICY "users_insert_admin"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role = 'Admin'
        )
    );

-- Only allow UPDATE if the user is an admin
CREATE POLICY "users_update_admin"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role = 'Admin'
        )
    );

-- Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
