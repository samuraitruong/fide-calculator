-- Initial schema with multiple profiles support
-- This allows parents to manage multiple children's profiles

-- Create tables for the FIDE calculator with multiple profiles support

-- Create user_profiles table for multiple profiles per user
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fide_id TEXT,
  title TEXT,
  federation TEXT,
  birth_year INTEGER,
  standard_rating INTEGER DEFAULT 1500,
  rapid_rating INTEGER DEFAULT 1500,
  blitz_rating INTEGER DEFAULT 1500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table that references user_profiles
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('standard', 'blitz', 'rapid')),
  month_key TEXT NOT NULL,
  player_rating INTEGER NOT NULL,
  opponent_name TEXT NOT NULL,
  opponent_rating INTEGER NOT NULL,
  k_factor INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'draw', 'loss')),
  rating_change DECIMAL(5,2) NOT NULL,
  game_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX idx_games_user_profile ON games(user_profile_id);
CREATE INDEX idx_games_rating_type ON games(rating_type);
CREATE INDEX idx_games_month_key ON games(month_key);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profiles
CREATE POLICY "Users can view own profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profiles
CREATE POLICY "Users can insert own profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY "Users can update own profiles" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profiles
CREATE POLICY "Users can delete own profiles" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Row Level Security (RLS) policies for games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Users can only see games for their profiles
CREATE POLICY "Users can view own games" ON games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = games.user_profile_id 
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can insert games for their profiles
CREATE POLICY "Users can insert own games" ON games
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = games.user_profile_id 
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can update games for their profiles
CREATE POLICY "Users can update own games" ON games
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = games.user_profile_id 
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can delete games for their profiles
CREATE POLICY "Users can delete own games" ON games
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = games.user_profile_id 
      AND user_profiles.user_id = auth.uid()
    )
  );
