-- Update User Registration Trigger to Auto-Add Test Stripe Accounts
-- This ensures all new users automatically get test Stripe accounts

-- First, let's see the current trigger function
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_type = 'FUNCTION';

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create updated function that includes test Stripe account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    stripe_account_id,
    stripe_onboarding_complete,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'acct_test_sandbox_testing',  -- Auto-assign test Stripe account
    true,                         -- Mark onboarding as complete
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the function by checking if it exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Verify the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
