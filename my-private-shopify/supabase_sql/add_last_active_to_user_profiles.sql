-- NOTE: This migration is for PostgreSQL/Supabase only. Do not run in MSSQL environments.
-- Add last_active timestamp to user_profiles for online status tracking
-- For PostgreSQL (Supabase uses PostgreSQL)


DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='user_profiles' AND column_name='last_active'
	) THEN
		ALTER TABLE user_profiles ADD COLUMN last_active timestamp with time zone;
	END IF;
END$$;
