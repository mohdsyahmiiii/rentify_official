-- Debug script to check rental status enum and recent rentals
-- Run this in your Supabase SQL editor to diagnose the issue

-- 1. Check if pending_pickup enum value exists
SELECT unnest(enum_range(NULL::rental_status)) AS status_values;

-- 2. Check recent rentals and their statuses
SELECT 
    id,
    status,
    payment_status,
    pickup_confirmed_at,
    created_at,
    updated_at
FROM rentals 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if the new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name IN ('pickup_confirmed_at', 'pickup_confirmed_by', 'pickup_notes');

-- 4. Try to manually update a rental to pending_pickup (this will fail if enum doesn't exist)
-- Uncomment the line below to test (replace 'your-rental-id' with actual ID)
-- UPDATE rentals SET status = 'pending_pickup' WHERE id = 'your-rental-id';
