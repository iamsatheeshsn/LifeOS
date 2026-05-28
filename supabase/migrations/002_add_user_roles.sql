-- User roles for demo / access tiers
CREATE TYPE user_role AS ENUM ('admin', 'member', 'family', 'partner');

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'member';

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Allow admins to read all profiles (optional — for future admin panel)
-- For now each user still only sees own data via existing RLS.

COMMENT ON COLUMN profiles.role IS 'User role: admin, member, family, or partner';
