-- ============================================
-- Add DELETE policies for user data deletion
-- ============================================
-- Fixes: User profile data not being deleted when "Delete Account" is pressed
-- Missing DELETE policies were blocking RLS-enabled deletions

-- User Profiles: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Daily States: Users can delete their own states
CREATE POLICY "Users can delete own daily states" ON daily_states
  FOR DELETE USING (auth.uid() = user_id);

-- Quests: Users can delete their own quests
CREATE POLICY "Users can delete own quests" ON quests
  FOR DELETE USING (auth.uid() = user_id);

-- API Requests: Users can delete their own requests
CREATE POLICY "Users can delete own requests" ON api_requests
  FOR DELETE USING (auth.uid() = user_id);
