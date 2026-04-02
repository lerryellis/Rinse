-- Add paid flag to usage table
ALTER TABLE public.usage ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;

-- Payments table (tracks Paystack transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address inet,
  reference text UNIQUE NOT NULL,
  amount_ghs numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  tool text,
  paystack_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_payments_reference ON public.payments (reference);
CREATE INDEX idx_payments_user ON public.payments (user_id, created_at DESC);
