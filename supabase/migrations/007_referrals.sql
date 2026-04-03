-- Add referral code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bonus_conversions int NOT NULL DEFAULT 0;

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bonus_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE INDEX idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles (referral_code);
