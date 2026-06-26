
-- Wallet
CREATE TABLE public.archive_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp bigint NOT NULL DEFAULT 0,
  rank text NOT NULL DEFAULT 'observer',
  tokens integer NOT NULL DEFAULT 0,
  lifetime_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.archive_wallets TO authenticated;
GRANT ALL ON public.archive_wallets TO service_role;
ALTER TABLE public.archive_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.archive_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Ledger
CREATE TABLE public.archive_wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('xp','token')),
  delta integer NOT NULL,
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'system',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX archive_wallet_ledger_user_idx ON public.archive_wallet_ledger(user_id, created_at DESC);
GRANT SELECT ON public.archive_wallet_ledger TO authenticated;
GRANT ALL ON public.archive_wallet_ledger TO service_role;
ALTER TABLE public.archive_wallet_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger read" ON public.archive_wallet_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Catalog
CREATE TABLE public.archive_redemption_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN ('subscription_month','shop_discount','cosmetic')),
  cost_tokens integer NOT NULL CHECK (cost_tokens > 0),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.archive_redemption_catalog TO anon, authenticated;
GRANT ALL ON public.archive_redemption_catalog TO service_role;
ALTER TABLE public.archive_redemption_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog public read" ON public.archive_redemption_catalog FOR SELECT TO anon, authenticated USING (active = true);

-- Redemptions
CREATE TABLE public.archive_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id uuid NOT NULL REFERENCES public.archive_redemption_catalog(id),
  catalog_code text NOT NULL,
  category text NOT NULL,
  cost_tokens integer NOT NULL,
  granted_months integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'fulfilled',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX archive_redemptions_user_idx ON public.archive_redemptions(user_id, created_at DESC);
GRANT SELECT ON public.archive_redemptions TO authenticated;
GRANT ALL ON public.archive_redemptions TO service_role;
ALTER TABLE public.archive_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own redemptions read" ON public.archive_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Helper: subscription months redeemed in trailing 365 days
CREATE OR REPLACE FUNCTION public.archive_subscription_months_used(p_user uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(SUM(granted_months), 0)::int
  FROM public.archive_redemptions
  WHERE user_id = p_user
    AND category = 'subscription_month'
    AND created_at > now() - interval '365 days';
$$;

-- Redeem function (caller-auth enforced via auth.uid())
CREATE OR REPLACE FUNCTION public.archive_redeem(p_catalog_id uuid)
RETURNS public.archive_redemptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.archive_redemption_catalog;
  v_wallet public.archive_wallets;
  v_months_used int;
  v_grant_months int := 0;
  v_redemption public.archive_redemptions;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT * INTO v_item FROM public.archive_redemption_catalog WHERE id = p_catalog_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'item not found'; END IF;

  -- Ensure wallet row
  INSERT INTO public.archive_wallets(user_id) VALUES (v_user) ON CONFLICT DO NOTHING;
  SELECT * INTO v_wallet FROM public.archive_wallets WHERE user_id = v_user FOR UPDATE;

  IF v_wallet.tokens < v_item.cost_tokens THEN
    RAISE EXCEPTION 'insufficient tokens';
  END IF;

  IF v_item.category = 'subscription_month' THEN
    v_grant_months := COALESCE((v_item.payload->>'months')::int, 1);
    v_months_used := public.archive_subscription_months_used(v_user);
    IF v_months_used + v_grant_months > 3 THEN
      RAISE EXCEPTION 'annual cap exceeded: % months already redeemed in trailing 365 days', v_months_used;
    END IF;
  END IF;

  UPDATE public.archive_wallets
    SET tokens = tokens - v_item.cost_tokens, updated_at = now()
    WHERE user_id = v_user;

  INSERT INTO public.archive_wallet_ledger(user_id, kind, delta, reason, source, metadata)
  VALUES (v_user, 'token', -v_item.cost_tokens, 'redemption:' || v_item.code, 'redeem',
          jsonb_build_object('catalog_id', v_item.id, 'category', v_item.category));

  INSERT INTO public.archive_redemptions(user_id, catalog_id, catalog_code, category, cost_tokens, granted_months)
  VALUES (v_user, v_item.id, v_item.code, v_item.category, v_item.cost_tokens, v_grant_months)
  RETURNING * INTO v_redemption;

  RETURN v_redemption;
END;
$$;
GRANT EXECUTE ON FUNCTION public.archive_redeem(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_subscription_months_used(uuid) TO authenticated;

-- Seed catalog
INSERT INTO public.archive_redemption_catalog(code, name, description, category, cost_tokens, payload) VALUES
  ('sub_month_reader', '1 Free Month · Reader', 'One free month of the Reader subscription tier.', 'subscription_month', 500, '{"months":1,"tier":"reader"}'),
  ('sub_month_initiate', '1 Free Month · Initiate', 'One free month of the Initiate subscription tier.', 'subscription_month', 1000, '{"months":1,"tier":"initiate"}'),
  ('sub_month_patron', '1 Free Month · Patron', 'One free month of the Patron subscription tier.', 'subscription_month', 2500, '{"months":1,"tier":"patron"}'),
  ('shop_10_off', 'Quartermaster · 10% Off', 'Single-use 10% discount code at the Quartermaster.', 'shop_discount', 250, '{"percent":10}'),
  ('shop_25_off', 'Quartermaster · 25% Off', 'Single-use 25% discount code at the Quartermaster.', 'shop_discount', 750, '{"percent":25}'),
  ('cosmetic_codename_glyph', 'Cosmetic · Codename Glyph', 'Display a classified glyph next to your codename.', 'cosmetic', 150, '{"slot":"codename_glyph"}');
