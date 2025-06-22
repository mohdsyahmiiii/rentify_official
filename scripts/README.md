# Database Setup Scripts

This folder contains SQL scripts to set up your Rentify database.

## Scripts Order

Run these scripts in order in your Supabase SQL Editor:

1. `01-create-tables.sql` - Creates all database tables
2. `02-setup-rls.sql` - Sets up Row Level Security policies
3. `03-add-stripe-fields.sql` - Adds Stripe-related fields
4. `04-add-agreement-fields.sql` - Adds rental agreement fields
5. `05-add-telegram-fields.sql` - Adds Telegram integration fields
6. `06-create-profile-trigger.sql` - **NEW** - Creates automatic profile creation trigger

## Important: Profile Creation Fix

If you're experiencing issues where user accounts don't appear in the database after registration, run script `06-create-profile-trigger.sql` in your Supabase SQL Editor.

This script:
- Creates a trigger that automatically creates a profile record when a new user signs up
- Ensures all future user registrations will have corresponding database records
- Fixes the issue where users can log in but don't appear in the profiles table

## How to Run

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the content of `06-create-profile-trigger.sql`
4. Click "Run" to execute the script

After running this script, all new user registrations will automatically create profile records in the database.
