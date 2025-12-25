-- Add is_admin flag to users for admin permissions
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;
