-- profiles: role per signed-in user
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('collector','recycler')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- recyclers: owner + contact + verification
ALTER TABLE public.recyclers
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS registration_reference text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.recyclers DROP CONSTRAINT IF EXISTS recyclers_verification_status_check;
ALTER TABLE public.recyclers ADD CONSTRAINT recyclers_verification_status_check
  CHECK (verification_status IN ('pending','verification_required','verified','rejected'));
CREATE UNIQUE INDEX IF NOT EXISTS recyclers_user_id_key ON public.recyclers (user_id) WHERE user_id IS NOT NULL;

-- honest demo statuses for existing prototype rows
UPDATE public.recyclers SET verification_status = 'pending' WHERE user_id IS NULL AND verification_status = 'pending';

GRANT INSERT, UPDATE ON public.recyclers TO authenticated;
DROP POLICY IF EXISTS "Recyclers create own facility" ON public.recyclers;
CREATE POLICY "Recyclers create own facility" ON public.recyclers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Recyclers update own facility" ON public.recyclers;
CREATE POLICY "Recyclers update own facility" ON public.recyclers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- a recycler can never set their own verification status
CREATE OR REPLACE FUNCTION public.lock_recycler_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.verification_status := OLD.verification_status;
    ELSE
      IF NEW.verification_status = 'verified' THEN
        NEW.verification_status := 'pending';
      END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS lock_recycler_verification_trg ON public.recyclers;
CREATE TRIGGER lock_recycler_verification_trg
  BEFORE INSERT OR UPDATE ON public.recyclers
  FOR EACH ROW EXECUTE FUNCTION public.lock_recycler_verification();

-- quotes: offer details
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS pickup_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_at timestamptz,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.quotes ALTER COLUMN status SET DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS quotes_recycler_idx ON public.quotes (recycler_id);

-- lots: recycler-side pickup progress
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS pickup_status text;
CREATE INDEX IF NOT EXISTS lots_status_idx ON public.lots (status);

-- collectors: optional owner account
ALTER TABLE public.collectors ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS collectors_user_id_key ON public.collectors (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_recycler_idx ON public.transactions (recycler_id);