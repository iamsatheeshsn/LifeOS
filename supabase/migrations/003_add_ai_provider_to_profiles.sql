ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_provider TEXT CHECK (ai_provider IN ('openai', 'gemini'));

COMMENT ON COLUMN profiles.ai_provider IS 'User AI provider preference: openai or gemini. Falls back to AI_PROVIDER env when null.';
