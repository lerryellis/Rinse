-- Fix infinite recursion in admin RLS policies.
-- The original admin policy on profiles did a subquery against profiles,
-- which triggered the same RLS policy, causing infinite recursion.
-- Solution: use a SECURITY DEFINER function that bypasses RLS.

-- Security definer function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = check_user_id),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: clean single SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- Usage: clean single SELECT policy
DROP POLICY IF EXISTS "Admins can view all usage" ON public.usage;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage;

CREATE POLICY "Users can view usage" ON public.usage
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Payments: clean single SELECT policy
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

CREATE POLICY "Users can view payments" ON public.payments
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );
