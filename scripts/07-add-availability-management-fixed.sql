-- Add comprehensive availability management system (FIXED VERSION)
-- This migration prevents double bookings and adds owner availability controls

-- Create availability_blocks table for owner manual controls
CREATE TABLE IF NOT EXISTS availability_blocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT DEFAULT 'Maintenance',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end_date is after start_date
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_blocks_item_dates ON availability_blocks(item_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_owner ON availability_blocks(owner_id);

-- Add buffer time settings to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS buffer_hours INTEGER DEFAULT 2;
ALTER TABLE items ADD COLUMN IF NOT EXISTS auto_block_during_rental BOOLEAN DEFAULT TRUE;

-- Create function to check if item is available for given dates
CREATE OR REPLACE FUNCTION is_item_available(
    p_item_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_rental_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    block_count INTEGER;
    item_available BOOLEAN;
BEGIN
    -- Check if item exists and is generally available
    SELECT is_available INTO item_available
    FROM items 
    WHERE id = p_item_id AND status = 'approved';
    
    IF NOT FOUND OR NOT item_available THEN
        RETURN FALSE;
    END IF;
    
    -- Check for conflicting active rentals using simple date overlap logic
    SELECT COUNT(*) INTO conflict_count
    FROM rentals
    WHERE item_id = p_item_id
      AND status IN ('pending_pickup', 'active')
      AND (p_exclude_rental_id IS NULL OR id != p_exclude_rental_id)
      AND (
        (start_date <= p_start_date AND end_date >= p_start_date) OR
        (start_date <= p_end_date AND end_date >= p_end_date) OR
        (start_date >= p_start_date AND end_date <= p_end_date)
      );
    
    IF conflict_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for owner availability blocks using simple date overlap logic
    SELECT COUNT(*) INTO block_count
    FROM availability_blocks
    WHERE item_id = p_item_id
      AND (
        (start_date <= p_start_date AND end_date >= p_start_date) OR
        (start_date <= p_end_date AND end_date >= p_end_date) OR
        (start_date >= p_start_date AND end_date <= p_end_date)
      );
    
    IF block_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get next available date for an item
CREATE OR REPLACE FUNCTION get_next_available_date(p_item_id UUID) RETURNS DATE AS $$
DECLARE
    next_date DATE;
    max_rental_end DATE;
    max_block_end DATE;
BEGIN
    -- Get the latest end date from active rentals
    SELECT MAX(end_date) INTO max_rental_end
    FROM rentals
    WHERE item_id = p_item_id
      AND status IN ('pending_pickup', 'active');
    
    -- Get the latest end date from availability blocks
    SELECT MAX(end_date) INTO max_block_end
    FROM availability_blocks
    WHERE item_id = p_item_id
      AND end_date >= CURRENT_DATE;
    
    -- Return the later of the two dates, or today if both are null
    next_date := GREATEST(
        COALESCE(max_rental_end, CURRENT_DATE),
        COALESCE(max_block_end, CURRENT_DATE)
    );
    
    -- Add one day to get the next available date
    RETURN next_date + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate rental dates before insert/update
CREATE OR REPLACE FUNCTION validate_rental_availability() RETURNS TRIGGER AS $$
BEGIN
    -- Skip validation for completed/cancelled rentals
    IF NEW.status IN ('completed', 'cancelled') THEN
        RETURN NEW;
    END IF;
    
    -- Check availability (exclude current rental for updates)
    IF NOT is_item_available(
        NEW.item_id, 
        NEW.start_date, 
        NEW.end_date,
        CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    ) THEN
        RAISE EXCEPTION 'Item is not available for the selected dates. Please choose different dates.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to rentals table
DROP TRIGGER IF EXISTS trigger_validate_rental_availability ON rentals;
CREATE TRIGGER trigger_validate_rental_availability
    BEFORE INSERT OR UPDATE ON rentals
    FOR EACH ROW
    EXECUTE FUNCTION validate_rental_availability();

-- Add comments for documentation
COMMENT ON TABLE availability_blocks IS 'Owner-controlled availability blocks for maintenance, personal use, etc.';
COMMENT ON COLUMN availability_blocks.reason IS 'Reason for blocking (Maintenance, Personal Use, Repair, etc.)';
COMMENT ON COLUMN items.buffer_hours IS 'Hours between rentals for cleaning/maintenance';
COMMENT ON COLUMN items.auto_block_during_rental IS 'Whether to automatically block item during active rentals';

COMMENT ON FUNCTION is_item_available IS 'Check if item is available for given date range, considering rentals and blocks';
COMMENT ON FUNCTION get_next_available_date IS 'Get the next date when item becomes available';

-- Create view for easy availability checking
CREATE OR REPLACE VIEW item_availability AS
SELECT 
    i.id as item_id,
    i.title,
    i.is_available as manually_available,
    i.status as item_status,
    CASE 
        WHEN i.status != 'approved' THEN FALSE
        WHEN NOT i.is_available THEN FALSE
        ELSE TRUE
    END as base_available,
    get_next_available_date(i.id) as next_available_date
FROM items i;

COMMENT ON VIEW item_availability IS 'Consolidated view of item availability status';

-- Add RLS policies for availability_blocks
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view availability blocks for items they can see" ON availability_blocks
    FOR SELECT USING (
        item_id IN (
            SELECT id FROM items WHERE status = 'approved'
        )
    );

CREATE POLICY "Owners can manage their item availability blocks" ON availability_blocks
    FOR ALL USING (owner_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON item_availability TO authenticated;
GRANT EXECUTE ON FUNCTION is_item_available TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_available_date TO authenticated;

-- Show completion message
SELECT 'Availability management system installed successfully!' as message;
