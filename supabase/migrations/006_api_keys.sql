-- API keys table for developer access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,  -- first 8 chars for display (e.g. "rk_live_a1b2...")
  name text NOT NULL DEFAULT 'Default',
  active boolean NOT NULL DEFAULT true,
  requests_today int NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON public.api_keys FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_api_keys_hash ON public.api_keys (key_hash);
CREATE INDEX idx_api_keys_user ON public.api_keys (user_id);
