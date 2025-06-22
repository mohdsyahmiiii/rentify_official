-- Add Stripe-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe-related fields to rentals table
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_rentals_stripe_session_id ON rentals(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_rentals_payment_intent_id ON rentals(payment_intent_id);
