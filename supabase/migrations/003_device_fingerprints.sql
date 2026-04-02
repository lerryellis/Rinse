-- Device fingerprints table: links browser fingerprints to user accounts
-- If the same device_id has already used free tier on another account, block it
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(device_id, user_id)
);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device links"
  ON public.device_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

-- Add device_id to usage table for cross-account tracking
ALTER TABLE public.usage ADD COLUMN IF NOT EXISTS device_id text;

CREATE INDEX idx_device_fingerprints_device ON public.device_fingerprints (device_id);
CREATE INDEX idx_usage_device ON public.usage (device_id, created_at DESC);
