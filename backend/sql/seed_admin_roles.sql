-- Seed first Super Admin role
-- 1) Create user in Supabase Auth first
-- 2) Replace USER_UUID_PLACEHOLDER with auth.users.id
-- 3) Run in Supabase SQL editor

insert into admin_user_roles (user_id, role, is_active)
values ('USER_UUID_PLACEHOLDER', 'super_admin', true)
on conflict (user_id, role) do update set
  is_active = true,
  updated_at = now();
