-- Add pickup confirmation functionality to rentals (FIXED VERSION)
-- This migration adds the "Item Received" confirmation feature

-- Check if pending_pickup already exists before adding
DO $$ 
BEGIN
    -- Try to add the enum value, ignore if it already exists
    BEGIN
        ALTER TYPE rental_status ADD VALUE 'pending_pickup';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'pending_pickup enum value already exists, skipping...';
    END;
END $$;

-- Add pickup confirmation tracking fields
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_confirmed_by UUID REFERENCES profiles(id);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS pickup_notes TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rentals_pickup_confirmed ON rentals(pickup_confirmed_at);

-- Create the status index only if the enum value exists
DO $$
BEGIN
    -- Check if pending_pickup exists in the enum
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending_pickup' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rental_status')
    ) THEN
        -- Create index only if enum value exists
        CREATE INDEX IF NOT EXISTS idx_rentals_status_pickup ON rentals(status) WHERE status = 'pending_pickup';
        RAISE NOTICE 'Created index for pending_pickup status';
    ELSE
        RAISE NOTICE 'pending_pickup enum value not found, skipping index creation';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN rentals.pickup_confirmed_at IS 'When the renter confirmed they received the item';
COMMENT ON COLUMN rentals.pickup_confirmed_by IS 'Renter who confirmed pickup/receipt of the item';
COMMENT ON COLUMN rentals.pickup_notes IS 'Optional notes from renter about item condition upon receipt';

-- Update any existing 'pending' rentals that have been paid to 'pending_pickup'
-- Only if the enum value exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending_pickup' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rental_status')
    ) THEN
        UPDATE rentals 
        SET status = 'pending_pickup', updated_at = NOW()
        WHERE status = 'pending' 
          AND payment_status = 'paid'
          AND pickup_confirmed_at IS NULL;
        
        RAISE NOTICE 'Updated existing paid rentals to pending_pickup status';
    ELSE
        RAISE NOTICE 'pending_pickup enum value not found, skipping status updates';
    END IF;
END $$;

-- Show final status
SELECT 'Migration completed. Current enum values:' as message;
SELECT unnest(enum_range(NULL::rental_status)) AS available_statuses;
