-- Add test Stripe Connect account ID for sandbox testing
-- This allows testing the payment flow without going through Stripe onboarding

-- First, let's find the owner of the real item you're testing with
-- Replace 'real-982b8597-a893-4597-94d1-aa3cf84671c6' with your actual item ID if different

-- Update the owner's profile with a test Stripe account ID
UPDATE profiles 
SET 
  stripe_account_id = 'acct_test_1234567890',
  stripe_onboarding_complete = true,
  updated_at = NOW()
WHERE id = (
  SELECT owner_id 
  FROM items 
  WHERE id = '982b8597-a893-4597-94d1-aa3cf84671c6'
);

-- Verify the update
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.stripe_account_id,
  p.stripe_onboarding_complete,
  i.title as item_title
FROM profiles p
JOIN items i ON p.id = i.owner_id
WHERE i.id = '982b8597-a893-4597-94d1-aa3cf84671c6';
