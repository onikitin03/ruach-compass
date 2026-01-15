-- ============================================
-- RUACH COMPASS - Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE ruach_state AS ENUM ('calm', 'tense', 'triggered', 'focused', 'drained');
CREATE TYPE trigger_type AS ENUM ('jealousy', 'uncertainty', 'anger', 'shame', 'loneliness', 'overwhelm');
CREATE TYPE quest_category AS ENUM ('micro', 'medium', 'courage', 'creation', 'body');
CREATE TYPE quest_type AS ENUM ('main', 'side');
CREATE TYPE focus_area AS ENUM ('work', 'relationship', 'body', 'creation');
CREATE TYPE tone_preference AS ENUM ('warm', 'direct', 'philosophical');
CREATE TYPE scenario_type AS ENUM ('provocation', 'accusation', 'coldness', 'drama', 'comparison', 'silence', 'blame', 'testing', 'manipulation', 'escalation');

-- ============================================
-- USER PROFILES
-- ============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'ru' CHECK (language = 'ru'),
  values TEXT[] DEFAULT '{}',
  triggers trigger_type[] DEFAULT '{}',
  preferred_tone tone_preference DEFAULT 'warm',
  trust_anchor_word TEXT DEFAULT 'ДОВЕРИЕ',
  boundaries_style TEXT DEFAULT 'firm' CHECK (boundaries_style IN ('firm', 'gentle')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY STATES (Check-ins)
-- ============================================

CREATE TABLE daily_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 10),
  stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 10),
  sleep_hours NUMERIC(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  focus focus_area NOT NULL,
  relationship_intensity INTEGER CHECK (relationship_intensity >= 1 AND relationship_intensity <= 10),
  work_intensity INTEGER CHECK (work_intensity >= 1 AND work_intensity <= 10),
  notes TEXT,
  ruach_state ruach_state,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- ============================================
-- QUESTS
-- ============================================

CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_state_id UUID REFERENCES daily_states(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type quest_type NOT NULL,
  category quest_category NOT NULL,
  title_ru TEXT NOT NULL,
  why_ru TEXT NOT NULL,
  steps_ru TEXT[] NOT NULL,
  fail_safe_ru TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  outcome_note TEXT,
  helped_rating INTEGER CHECK (helped_rating >= 1 AND helped_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- SCRIPTS CACHE
-- ============================================

CREATE TABLE scripts_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_type scenario_type NOT NULL,
  short_ru TEXT NOT NULL,
  neutral_ru TEXT NOT NULL,
  boundary_ru TEXT NOT NULL,
  exit_ru TEXT NOT NULL,
  tone_notes_ru TEXT,
  safety_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, scenario_type)
);

-- ============================================
-- API REQUESTS (Rate Limiting)
-- ============================================

CREATE TABLE api_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast rate limit queries
CREATE INDEX idx_api_requests_user_time ON api_requests(user_id, created_at DESC);

-- Auto-cleanup old requests (keep last 24h)
CREATE OR REPLACE FUNCTION cleanup_old_requests()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM api_requests WHERE created_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_requests
AFTER INSERT ON api_requests
EXECUTE FUNCTION cleanup_old_requests();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_daily_states_user_date ON daily_states(user_id, date DESC);
CREATE INDEX idx_quests_user_date ON quests(user_id, date DESC);
CREATE INDEX idx_scripts_cache_user ON scripts_cache(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Daily States: Users can only access their own states
CREATE POLICY "Users can view own daily states" ON daily_states
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily states" ON daily_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily states" ON daily_states
  FOR UPDATE USING (auth.uid() = user_id);

-- Quests: Users can only access their own quests
CREATE POLICY "Users can view own quests" ON quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests" ON quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests" ON quests
  FOR UPDATE USING (auth.uid() = user_id);

-- Scripts Cache: Users can only access their own cached scripts
CREATE POLICY "Users can view own scripts" ON scripts_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts" ON scripts_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts" ON scripts_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts" ON scripts_cache
  FOR DELETE USING (auth.uid() = user_id);

-- API Requests: Users can only access their own requests
CREATE POLICY "Users can view own requests" ON api_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON api_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
