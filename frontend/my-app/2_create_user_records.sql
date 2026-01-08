-- ============================================
-- STEP 2: Create User Records in Users Table
-- ============================================
-- Run this AFTER running 1_create_auth_users.sql
-- This links auth users to your users table with roles

-- Admin User
INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Admin User',
  'Admin',
  NULL,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'admin@alansari.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'Admin', 
  full_name = 'Admin User',
  email = 'admin@alansari.com';

-- Front Desk User
INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Front Desk User',
  'Front Desk',
  NULL,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'frontdesk@alansari.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'Front Desk', 
  full_name = 'Front Desk User',
  email = 'frontdesk@alansari.com';

-- Engineer 1
INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Engineer One',
  'Engineer',
  'ENG1',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'engineer1@alansari.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'Engineer', 
  full_name = 'Engineer One',
  email = 'engineer1@alansari.com',
  linked_engineer_id = 'ENG1';

-- Engineer 2
INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Engineer Two',
  'Engineer',
  'ENG2',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'engineer2@alansari.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'Engineer', 
  full_name = 'Engineer Two',
  email = 'engineer2@alansari.com',
  linked_engineer_id = 'ENG2';

-- Verify all users created correctly
SELECT 
  u.email, 
  u.full_name,
  u.role, 
  u.linked_engineer_id,
  CASE WHEN au.id IS NOT NULL THEN '✓' ELSE '✗' END as auth_exists
FROM users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.email IN ('admin@alansari.com', 'frontdesk@alansari.com', 'engineer1@alansari.com', 'engineer2@alansari.com')
ORDER BY u.email;
