-- Support tickets system
CREATE TABLE IF NOT EXISTS public.tickets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'bug', 'payment', 'account', 'tool_error', 'feature_request', 'api'
  )),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ticket messages (conversation thread)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id bigint REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets, admins see all
CREATE POLICY "Users can view own tickets" ON public.tickets
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can add messages to own tickets" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE INDEX idx_tickets_user ON public.tickets (user_id, status);
CREATE INDEX idx_tickets_status ON public.tickets (status, priority);
CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages (ticket_id);
