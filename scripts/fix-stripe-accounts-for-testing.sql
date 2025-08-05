-- Fix Stripe Accounts for Testing
-- This script adds test Stripe account IDs to all users who don't have one
-- This allows all items to be rentable for testing purposes

-- Update all profiles that don't have a stripe_account_id
UPDATE public.profiles 
SET 
  stripe_account_id = 'acct_test_sandbox_testing',
  stripe_onboarding_complete = true,
  updated_at = NOW()
WHERE 
  stripe_account_id IS NULL 
  OR stripe_account_id = '';

-- Also update any profiles that might have empty string
UPDATE public.profiles 
SET 
  stripe_account_id = 'acct_test_sandbox_testing',
  stripe_onboarding_complete = true,
  updated_at = NOW()
WHERE 
  stripe_account_id = '';

-- Verify the update
SELECT 
  id,
  full_name,
  email,
  stripe_account_id,
  stripe_onboarding_complete,
  created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;

-- Count how many profiles now have test accounts
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN stripe_account_id = 'acct_test_sandbox_testing' THEN 1 END) as test_accounts,
  COUNT(CASE WHEN stripe_onboarding_complete = true THEN 1 END) as onboarding_complete
FROM public.profiles;
