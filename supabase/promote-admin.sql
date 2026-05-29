-- Replace this email with the account created at /register.
-- Run after the user exists in Supabase Auth and public.profiles was created.

update public.profiles
set role = 'admin'
where user_id = (
  select id
  from auth.users
  where email = 'admin@maxcinema.local'
);

select
  profiles.id,
  auth.users.email,
  profiles.full_name,
  profiles.role
from public.profiles
join auth.users on auth.users.id = profiles.user_id
where auth.users.email = 'admin@maxcinema.local';
