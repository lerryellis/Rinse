-- Teams / Organizations
CREATE TABLE IF NOT EXISTS public.teams (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_members int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id bigint REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Add team_id to profiles for quick lookup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id bigint REFERENCES public.teams(id) ON DELETE SET NULL;

-- RLS: members can view their own team
CREATE POLICY "Team members can view team" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Team members can view members" ON public.team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE INDEX idx_team_members_user ON public.team_members (user_id);
CREATE INDEX idx_team_members_team ON public.team_members (team_id);
