-- Add test Stripe Connect account ID for production testing
-- This allows testing the payment flow without real Stripe Connect onboarding

-- Update ALL item owners with a test Stripe account ID
-- This ensures any item can be rented for testing purposes
UPDATE profiles 
SET 
  stripe_account_id = 'acct_test_sandbox_testing',
  stripe_onboarding_complete = true,
  updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT owner_id 
  FROM items 
  WHERE status = 'approved' OR status = 'pending'
);

-- Verify the update - check which profiles now have test accounts
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.stripe_account_id,
  p.stripe_onboarding_complete,
  COUNT(i.id) as item_count
FROM profiles p
LEFT JOIN items i ON p.id = i.owner_id
WHERE p.stripe_account_id = 'acct_test_sandbox_testing'
GROUP BY p.id, p.full_name, p.email, p.stripe_account_id, p.stripe_onboarding_complete
ORDER BY p.full_name;
