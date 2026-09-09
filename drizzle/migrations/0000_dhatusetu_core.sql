CREATE TABLE public.collectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  preferred_language text NOT NULL DEFAULT 'en',
  operating_location text,
  total_earnings numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  pending_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.collectors TO anon, authenticated;
GRANT ALL ON public.collectors TO service_role;
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read collectors" ON public.collectors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo insert collectors" ON public.collectors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "demo update collectors" ON public.collectors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_category text NOT NULL,
  location text NOT NULL DEFAULT 'General',
  buying_price_min numeric NOT NULL,
  buying_price_max numeric NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_category, location, effective_date)
);
GRANT SELECT ON public.prices TO anon, authenticated;
GRANT ALL ON public.prices TO service_role;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read prices" ON public.prices FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.recyclers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  materials_accepted text[] NOT NULL DEFAULT '{}',
  authorization_status text NOT NULL DEFAULT 'DEMO DATA — unverified',
  offered_rate numeric NOT NULL DEFAULT 0.9,
  pickup_available text,
  service_area text,
  contact_details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recyclers TO anon, authenticated;
GRANT ALL ON public.recyclers TO service_role;
ALTER TABLE public.recyclers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read recyclers" ON public.recyclers FOR SELECT TO anon, authenticated USING (true);

CREATE SEQUENCE public.lot_code_seq START 4821;
GRANT USAGE ON SEQUENCE public.lot_code_seq TO anon, authenticated, service_role;

CREATE TABLE public.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id text NOT NULL UNIQUE DEFAULT ('K-' || nextval('public.lot_code_seq')),
  collector_id uuid NOT NULL REFERENCES public.collectors(id) ON DELETE CASCADE,
  material_category text NOT NULL,
  material_description text,
  image_url text,
  approximate_weight numeric NOT NULL,
  condition text NOT NULL DEFAULT 'Clean sorted',
  estimated_min_value numeric,
  estimated_max_value numeric,
  status text NOT NULL DEFAULT 'draft',
  collection_location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lots_collector_idx ON public.lots (collector_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.lots TO anon, authenticated;
GRANT ALL ON public.lots TO service_role;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read lots" ON public.lots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo insert lots" ON public.lots FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "demo update lots" ON public.lots FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  recycler_id uuid NOT NULL REFERENCES public.recyclers(id) ON DELETE CASCADE,
  quoted_rate numeric NOT NULL,
  estimated_total numeric NOT NULL,
  status text NOT NULL DEFAULT 'offered',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lot_id, recycler_id)
);
GRANT SELECT, INSERT, UPDATE ON public.quotes TO anon, authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read quotes" ON public.quotes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo insert quotes" ON public.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "demo update quotes" ON public.quotes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL UNIQUE REFERENCES public.lots(id) ON DELETE CASCADE,
  collector_id uuid NOT NULL REFERENCES public.collectors(id) ON DELETE CASCADE,
  recycler_id uuid REFERENCES public.recyclers(id) ON DELETE SET NULL,
  final_weight numeric,
  final_price numeric,
  total_amount numeric,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'Pending',
  handover_timestamp timestamptz,
  handover_location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_collector_idx ON public.transactions (collector_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.transactions TO anon, authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read transactions" ON public.transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo insert transactions" ON public.transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "demo update transactions" ON public.transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.collectors (id, name, preferred_language, operating_location)
VALUES ('11111111-1111-4111-8111-111111111111', 'Ravi Kadam', 'hi', 'Pune, Maharashtra');

INSERT INTO public.prices (material_category, location, buying_price_min, buying_price_max, unit) VALUES
  ('pcb', 'Pune, Maharashtra', 320, 410, 'kg'),
  ('cables', 'Pune, Maharashtra', 180, 240, 'kg'),
  ('batteries', 'Pune, Maharashtra', 60, 95, 'kg'),
  ('motors', 'Pune, Maharashtra', 70, 110, 'kg'),
  ('lcd', 'Pune, Maharashtra', 90, 140, 'kg'),
  ('crt', 'General', 15, 30, 'kg'),
  ('plastics', 'General', 12, 22, 'kg');

INSERT INTO public.recyclers (id, name, location, materials_accepted, authorization_status, offered_rate, pickup_available, service_area, contact_details) VALUES
  ('22222222-2222-4222-8222-222222222221', 'GreenCore E-Waste', 'Hadapsar, Pune', ARRAY['pcb','cables','lcd','motors','batteries'], 'DEMO DATA — authorised (prototype record, not a real CPCB registration)', 0.98, 'Picks today 3-6 pm', 'Pune, Maharashtra', 'demo@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'OmniRecycle', 'Bhosari, Pune', ARRAY['pcb','cables','lcd','crt','plastics'], 'DEMO DATA — authorised (prototype record, not a real CPCB registration)', 0.92, 'Picks tomorrow', 'Pune, Maharashtra', 'demo@example.invalid'),
  ('22222222-2222-4222-8222-222222222223', 'Ravan Scrap Co.', 'Kondhwa, Pune', ARRAY['pcb','cables','batteries','motors','crt','plastics','lcd'], 'DEMO DATA — authorisation pending (prototype record)', 0.86, 'Self drop-off only', 'Pune, Maharashtra', 'demo@example.invalid');

INSERT INTO public.lots (id, lot_id, collector_id, material_category, material_description, approximate_weight, condition, estimated_min_value, estimated_max_value, status, collection_location) VALUES
  ('33333333-3333-4333-8333-333333333331', 'K-4801', '11111111-1111-4111-8111-111111111111', 'cables', 'Mixed copper cables from housing society', 12.5, 'Clean sorted', 2250, 3000, 'draft', 'Kothrud, Pune'),
  ('33333333-3333-4333-8333-333333333332', 'K-4802', '11111111-1111-4111-8111-111111111111', 'pcb', 'Old desktop motherboards', 9.2, 'Mixed', 2944, 3772, 'settled', 'Shivajinagar, Pune');

INSERT INTO public.quotes (lot_id, recycler_id, quoted_rate, estimated_total, status) VALUES
  ('33333333-3333-4333-8333-333333333332', '22222222-2222-4222-8222-222222222222', 336, 3091, 'accepted');

INSERT INTO public.transactions (lot_id, collector_id, recycler_id, final_weight, final_price, total_amount, payment_method, payment_status, handover_timestamp, handover_location) VALUES
  ('33333333-3333-4333-8333-333333333332', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 9.2, 336, 3091, 'Cash', 'Paid', now() - interval '3 days', 'Shivajinagar, Pune');
