-- Add pickup confirmation functionality to rentals
-- This migration adds the "Item Received" confirmation feature

-- First, add the new status to the rental_status enum
-- We need to commit this before using the new value
ALTER TYPE rental_status ADD VALUE IF NOT EXISTS 'pending_pickup';

-- Commit the enum change before proceeding
COMMIT;

-- Start a new transaction for the rest of the changes
BEGIN;

-- Add pickup confirmation tracking fields
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_confirmed_by UUID REFERENCES profiles(id);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_notes TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rentals_pickup_confirmed ON rentals(pickup_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_rentals_status_pickup ON rentals(status) WHERE status = 'pending_pickup';

-- Add comments for documentation
COMMENT ON COLUMN rentals.pickup_confirmed_at IS 'When the renter confirmed they received the item';
COMMENT ON COLUMN rentals.pickup_confirmed_by IS 'Renter who confirmed pickup/receipt of the item';
COMMENT ON COLUMN rentals.pickup_notes IS 'Optional notes from renter about item condition upon receipt';

-- Update any existing 'pending' rentals that have been paid to 'pending_pickup'
-- This ensures backward compatibility for any existing paid rentals
UPDATE rentals
SET status = 'pending_pickup', updated_at = NOW()
WHERE status = 'pending'
  AND payment_status = 'paid'
  AND pickup_confirmed_at IS NULL;

-- Commit all changes
COMMIT;
