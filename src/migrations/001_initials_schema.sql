-- src/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
CREATE TYPE quest_status AS ENUM ('active', 'completed', 'failed', 'abandoned');
CREATE TYPE quest_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE device_platform AS ENUM ('mobile', 'desktop', 'web');
CREATE TYPE item_type AS ENUM ('consumable', 'equipment', 'cosmetic', 'booster');
CREATE TYPE day_of_week AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

-- Users table (extending Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  fcm_token TEXT,
  device_platform device_platform DEFAULT 'web',
  free_days day_of_week[] DEFAULT ARRAY['Saturday', 'Sunday']::day_of_week[],
  notification_preferences JSONB DEFAULT '{
    "pushEnabled": true,
    "socketEnabled": true,
    "naggingEnabled": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quests table
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT DEFAULT '',
  status quest_status DEFAULT 'active',
  priority quest_priority DEFAULT 'medium',
  deadline TIMESTAMPTZ NOT NULL,
  xp_reward INTEGER DEFAULT 100,
  tags TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  streak_current INTEGER DEFAULT 0,
  streak_longest INTEGER DEFAULT 0,
  streak_last_active_date DATE,
  total_quests_completed INTEGER DEFAULT 0,
  total_quests_failed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type item_type DEFAULT 'consumable',
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Notification logs table (for tracking sent notifications)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'push', 'socket', 'nagging', 'deadline'
  title TEXT,
  body TEXT,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for better performance
CREATE INDEX idx_quests_user_id ON public.quests(user_id);
CREATE INDEX idx_quests_status ON public.quests(status);
CREATE INDEX idx_quests_deadline ON public.quests(deadline);
CREATE INDEX idx_quests_user_status ON public.quests(user_id, status);
CREATE INDEX idx_inventory_user ON public.inventory_items(user_id);
CREATE INDEX idx_notification_logs_user ON public.notification_logs(user_id, sent_at DESC);

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate level from XP (sqrt formula: level = sqrt(xp/100) + 1)
CREATE OR REPLACE FUNCTION calculate_level(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(SQRT(xp_amount::FLOAT / 100)) + 1;
END;
$$ language 'plpgsql';

-- Function to handle quest completion
CREATE OR REPLACE FUNCTION handle_quest_completion()
RETURNS TRIGGER AS $$
DECLARE
  current_xp INTEGER;
  new_level INTEGER;
  yesterday DATE;
BEGIN
  -- Only process when quest is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get current stats
    SELECT xp, level, streak_current, streak_last_active_date 
    INTO current_xp, new_level, NEW.streak_current, NEW.streak_last_active_date
    FROM public.user_stats 
    WHERE user_id = NEW.user_id;
    
    -- Update XP
    current_xp := COALESCE(current_xp, 0) + NEW.xp_reward;
    
    -- Calculate new level
    new_level := calculate_level(current_xp);
    
    -- Calculate streak
    yesterday := CURRENT_DATE - INTERVAL '1 day';
    IF NEW.streak_last_active_date = yesterday THEN
      NEW.streak_current := COALESCE(NEW.streak_current, 0) + 1;
    ELSIF NEW.streak_last_active_date != CURRENT_DATE THEN
      NEW.streak_current := 1;
    END IF;
    
    -- Update streak longest
    IF NEW.streak_current > COALESCE(NEW.streak_longest, 0) THEN
      NEW.streak_longest := NEW.streak_current;
    END IF;
    
    NEW.streak_last_active_date := CURRENT_DATE;
    
    -- Update user stats
    UPDATE public.user_stats 
    SET 
      xp = current_xp,
      level = new_level,
      streak_current = NEW.streak_current,
      streak_longest = NEW.streak_longest,
      streak_last_active_date = NEW.streak_last_active_date,
      total_quests_completed = total_quests_completed + 1,
      total_xp_earned = total_xp_earned + NEW.xp_reward,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle quest failure
CREATE OR REPLACE FUNCTION handle_quest_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    UPDATE public.user_stats 
    SET 
      total_quests_failed = total_quests_failed + 1,
      streak_current = 0,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers

-- Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Quest completion handler
CREATE TRIGGER on_quest_completion
  AFTER UPDATE OF status ON public.quests
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION handle_quest_completion();

-- Quest failure handler
CREATE TRIGGER on_quest_failure
  AFTER UPDATE OF status ON public.quests
  FOR EACH ROW
  WHEN (NEW.status = 'failed' AND OLD.status != 'failed')
  EXECUTE FUNCTION handle_quest_failure();

-- Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Quests policies
CREATE POLICY "Users can view own quests"
  ON public.quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quests"
  ON public.quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
  ON public.quests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quests"
  ON public.quests FOR DELETE
  USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Inventory policies
CREATE POLICY "Users can view own inventory"
  ON public.inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own inventory"
  ON public.inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.inventory_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Notification logs policies
CREATE POLICY "Users can view own notifications"
  ON public.notification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();