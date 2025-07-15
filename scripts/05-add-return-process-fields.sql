-- Add return process fields to rentals table
-- This migration adds comprehensive return management functionality

-- Add return process tracking fields
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS return_initiated_by UUID REFERENCES profiles(id);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS return_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS return_confirmed_by UUID REFERENCES profiles(id);

-- Add late fee and overdue tracking
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS actual_return_date DATE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS late_days INTEGER DEFAULT 0;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS late_fee_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add damage and security deposit handling
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS damage_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS damage_description TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS damage_photos TEXT[]; -- Array of photo URLs
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS security_deposit_returned DECIMAL(10,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS security_deposit_deduction DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS security_deposit_reason TEXT;

-- Add return reminder tracking
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS return_reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS overdue_reminder_sent BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rentals_return_initiated ON rentals(return_initiated_at);
CREATE INDEX IF NOT EXISTS idx_rentals_return_confirmed ON rentals(return_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_rentals_end_date_status ON rentals(end_date, status);
CREATE INDEX IF NOT EXISTS idx_rentals_late_days ON rentals(late_days) WHERE late_days > 0;

-- Add comments for documentation
COMMENT ON COLUMN rentals.return_initiated_at IS 'When the return process was started (by renter or auto)';
COMMENT ON COLUMN rentals.return_initiated_by IS 'User who initiated the return process';
COMMENT ON COLUMN rentals.return_confirmed_at IS 'When the owner confirmed item was returned';
COMMENT ON COLUMN rentals.return_confirmed_by IS 'Owner who confirmed the return';
COMMENT ON COLUMN rentals.actual_return_date IS 'Actual date when item was returned';
COMMENT ON COLUMN rentals.late_days IS 'Number of days the return was late';
COMMENT ON COLUMN rentals.late_fee_amount IS 'Total late fees charged';
COMMENT ON COLUMN rentals.damage_reported IS 'Whether any damage was reported';
COMMENT ON COLUMN rentals.damage_description IS 'Description of any damage found';
COMMENT ON COLUMN rentals.damage_photos IS 'Array of URLs to damage photos';
COMMENT ON COLUMN rentals.security_deposit_returned IS 'Amount of security deposit returned';
COMMENT ON COLUMN rentals.security_deposit_deduction IS 'Amount deducted from security deposit';
COMMENT ON COLUMN rentals.security_deposit_reason IS 'Reason for security deposit deduction';
