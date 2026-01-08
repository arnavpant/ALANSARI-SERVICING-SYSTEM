-- Run this SQL in Supabase SQL Editor AFTER creating the 4 auth users

-- Link auth users to users table with roles
INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Admin User',
  'Admin',
  NULL,
  now(),
  now()
FROM auth.users WHERE email = 'admin@alansari.com'
ON CONFLICT (id) DO UPDATE SET role = 'Admin', full_name = 'Admin User';

INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Front Desk User',
  'Front Desk',
  NULL,
  now(),
  now()
FROM auth.users WHERE email = 'frontdesk@alansari.com'
ON CONFLICT (id) DO UPDATE SET role = 'Front Desk', full_name = 'Front Desk User';

INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Engineer One',
  'Engineer',
  'ENG1',
  now(),
  now()
FROM auth.users WHERE email = 'engineer1@alansari.com'
ON CONFLICT (id) DO UPDATE SET role = 'Engineer', full_name = 'Engineer One', linked_engineer_id = 'ENG1';

INSERT INTO users (id, email, full_name, role, linked_engineer_id, created_at, updated_at)
SELECT 
  id,
  email,
  'Engineer Two',
  'Engineer',
  'ENG2',
  now(),
  now()
FROM auth.users WHERE email = 'engineer2@alansari.com'
ON CONFLICT (id) DO UPDATE SET role = 'Engineer', full_name = 'Engineer Two', linked_engineer_id = 'ENG2';

-- Verify
SELECT u.email, u.role, u.full_name, u.linked_engineer_id 
FROM users u
ORDER BY u.email;
