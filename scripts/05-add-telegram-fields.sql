-- Add Telegram-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_link_token TEXT;

-- Create indexes for Telegram fields
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_link_token ON profiles(telegram_link_token);

-- Add notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"telegram": true, "email": true, "rental_reminders": true, "payment_updates": true}';
