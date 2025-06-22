-- Add agreement fields to rentals table
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS rental_agreement TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS agreement_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS agreement_accepted_by_renter BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS agreement_accepted_by_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS renter_signature TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS owner_signature TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMP WITH TIME ZONE;

-- Create index for agreement queries
CREATE INDEX IF NOT EXISTS idx_rentals_agreement_generated ON rentals(agreement_generated_at);
