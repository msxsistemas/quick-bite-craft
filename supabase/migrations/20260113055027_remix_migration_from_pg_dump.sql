CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'reseller',
    'restaurant_admin'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- If user signed up as reseller, add reseller role
  IF NEW.raw_user_meta_data ->> 'role' = 'reseller' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'reseller');
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: use_coupon(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.use_coupon(p_coupon_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE id = p_coupon_id;
END;
$$;


--
-- Name: validate_coupon(uuid, text, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_coupon(p_restaurant_id uuid, p_code text, p_order_total numeric) RETURNS TABLE(valid boolean, coupon_id uuid, discount_type text, discount_value numeric, error_message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons c
  WHERE c.restaurant_id = p_restaurant_id
    AND UPPER(c.code) = UPPER(p_code)
    AND c.active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Cupom não encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Cupom expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Cupom esgotado'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum order value
  IF p_order_total < v_coupon.min_order_value THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 
      ('Pedido mínimo de R$ ' || REPLACE(TO_CHAR(v_coupon.min_order_value, 'FM999999990.00'), '.', ','))::TEXT;
    RETURN;
  END IF;
  
  -- Coupon is valid
  RETURN QUERY SELECT 
    true, 
    v_coupon.id, 
    v_coupon.discount_type, 
    v_coupon.discount_value, 
    NULL::TEXT;
END;
$_$;


SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    emoji text DEFAULT '🍽️'::text,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    code text NOT NULL,
    discount_type text NOT NULL,
    discount_value numeric DEFAULT 0 NOT NULL,
    min_order_value numeric DEFAULT 0 NOT NULL,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone,
    active boolean DEFAULT true NOT NULL,
    visible boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text])))
);


--
-- Name: delivery_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    fee numeric(10,2) DEFAULT 0 NOT NULL,
    min_order numeric(10,2) DEFAULT 0 NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: extra_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    internal_name text NOT NULL,
    display_title text NOT NULL,
    subtitle text,
    max_selections integer DEFAULT 1 NOT NULL,
    required boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: extra_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    name text NOT NULL,
    price numeric DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: operating_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operating_hours (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone DEFAULT '11:00:00'::time without time zone NOT NULL,
    end_time time without time zone DEFAULT '23:00:00'::time without time zone NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT operating_hours_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    price numeric DEFAULT 0 NOT NULL,
    image_url text,
    active boolean DEFAULT true NOT NULL,
    visible boolean DEFAULT false NOT NULL,
    extra_groups uuid[] DEFAULT '{}'::uuid[],
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reseller_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reseller_id uuid NOT NULL,
    full_name text,
    company_name text,
    phone text,
    primary_color text DEFAULT '#FF9500'::text,
    secondary_color text DEFAULT '#1E57DC'::text,
    mercadopago_enabled boolean DEFAULT false,
    mercadopago_access_token text,
    mercadopago_public_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: restaurant_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    charge_mode text DEFAULT 'fixed'::text NOT NULL,
    fixed_delivery_fee numeric(10,2) DEFAULT 0 NOT NULL,
    min_delivery_time integer DEFAULT 30 NOT NULL,
    max_delivery_time integer DEFAULT 50 NOT NULL,
    pix_key_type text,
    pix_key text,
    app_name text DEFAULT 'Cardápio'::text,
    short_name text DEFAULT 'Cardápio'::text,
    whatsapp_msg_pix text,
    whatsapp_msg_accepted text,
    whatsapp_msg_delivery text,
    whatsapp_msg_delivered text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: restaurant_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    plan_id uuid,
    status text DEFAULT 'trial'::text NOT NULL,
    trial_ends_at timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    monthly_fee numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT restaurant_subscriptions_status_check CHECK ((status = ANY (ARRAY['trial'::text, 'active'::text, 'pending'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reseller_id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    logo text,
    banner text,
    phone text,
    whatsapp text,
    address text,
    delivery_time text DEFAULT '30-45 min'::text,
    delivery_fee numeric(10,2) DEFAULT 0,
    is_open boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date NOT NULL,
    paid_at timestamp with time zone,
    payment_method text,
    external_payment_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscription_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reseller_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric DEFAULT 99.90 NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_restaurant_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_restaurant_id_code_key UNIQUE (restaurant_id, code);


--
-- Name: delivery_zones delivery_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_pkey PRIMARY KEY (id);


--
-- Name: extra_groups extra_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_groups
    ADD CONSTRAINT extra_groups_pkey PRIMARY KEY (id);


--
-- Name: extra_options extra_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_options
    ADD CONSTRAINT extra_options_pkey PRIMARY KEY (id);


--
-- Name: operating_hours operating_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operating_hours
    ADD CONSTRAINT operating_hours_pkey PRIMARY KEY (id);


--
-- Name: operating_hours operating_hours_restaurant_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operating_hours
    ADD CONSTRAINT operating_hours_restaurant_id_day_of_week_key UNIQUE (restaurant_id, day_of_week);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: reseller_settings reseller_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_settings
    ADD CONSTRAINT reseller_settings_pkey PRIMARY KEY (id);


--
-- Name: reseller_settings reseller_settings_reseller_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_settings
    ADD CONSTRAINT reseller_settings_reseller_id_key UNIQUE (reseller_id);


--
-- Name: restaurant_settings restaurant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_settings
    ADD CONSTRAINT restaurant_settings_pkey PRIMARY KEY (id);


--
-- Name: restaurant_settings restaurant_settings_restaurant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_settings
    ADD CONSTRAINT restaurant_settings_restaurant_id_key UNIQUE (restaurant_id);


--
-- Name: restaurant_subscriptions restaurant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_subscriptions
    ADD CONSTRAINT restaurant_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: restaurant_subscriptions restaurant_subscriptions_restaurant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_subscriptions
    ADD CONSTRAINT restaurant_subscriptions_restaurant_id_key UNIQUE (restaurant_id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_slug_key UNIQUE (slug);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_categories_restaurant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_restaurant_id ON public.categories USING btree (restaurant_id);


--
-- Name: idx_categories_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_sort_order ON public.categories USING btree (sort_order);


--
-- Name: idx_products_restaurant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_restaurant_id ON public.products USING btree (restaurant_id);


--
-- Name: idx_products_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_sort_order ON public.products USING btree (sort_order);


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: coupons update_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: delivery_zones update_delivery_zones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: extra_groups update_extra_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_extra_groups_updated_at BEFORE UPDATE ON public.extra_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: extra_options update_extra_options_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_extra_options_updated_at BEFORE UPDATE ON public.extra_options FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: operating_hours update_operating_hours_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_operating_hours_updated_at BEFORE UPDATE ON public.operating_hours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reseller_settings update_reseller_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reseller_settings_updated_at BEFORE UPDATE ON public.reseller_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: restaurant_settings update_restaurant_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_restaurant_settings_updated_at BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: restaurant_subscriptions update_restaurant_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_restaurant_subscriptions_updated_at BEFORE UPDATE ON public.restaurant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: restaurants update_restaurants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription_payments update_subscription_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscription_payments_updated_at BEFORE UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription_plans update_subscription_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categories categories_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: delivery_zones delivery_zones_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: extra_groups extra_groups_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_groups
    ADD CONSTRAINT extra_groups_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: extra_options extra_options_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_options
    ADD CONSTRAINT extra_options_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.extra_groups(id) ON DELETE CASCADE;


--
-- Name: operating_hours operating_hours_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operating_hours
    ADD CONSTRAINT operating_hours_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: products products_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: restaurant_settings restaurant_settings_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_settings
    ADD CONSTRAINT restaurant_settings_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurant_subscriptions restaurant_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_subscriptions
    ADD CONSTRAINT restaurant_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE SET NULL;


--
-- Name: restaurant_subscriptions restaurant_subscriptions_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_subscriptions
    ADD CONSTRAINT restaurant_subscriptions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurants restaurants_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.restaurant_subscriptions(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: delivery_zones Authenticated users can delete delivery_zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete delivery_zones" ON public.delivery_zones FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: operating_hours Authenticated users can delete operating_hours; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete operating_hours" ON public.operating_hours FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: delivery_zones Authenticated users can insert delivery_zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert delivery_zones" ON public.delivery_zones FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: operating_hours Authenticated users can insert operating_hours; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert operating_hours" ON public.operating_hours FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: restaurant_settings Authenticated users can insert restaurant_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert restaurant_settings" ON public.restaurant_settings FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: delivery_zones Authenticated users can update delivery_zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update delivery_zones" ON public.delivery_zones FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: operating_hours Authenticated users can update operating_hours; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update operating_hours" ON public.operating_hours FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: restaurant_settings Authenticated users can update restaurant_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update restaurant_settings" ON public.restaurant_settings FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: categories Public can view active categories of open restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active categories of open restaurants" ON public.categories FOR SELECT USING (((active = true) AND (EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = categories.restaurant_id) AND (r.is_open = true))))));


--
-- Name: extra_groups Public can view active extra groups of open restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active extra groups of open restaurants" ON public.extra_groups FOR SELECT USING (((active = true) AND (EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = extra_groups.restaurant_id) AND (r.is_open = true))))));


--
-- Name: extra_options Public can view active extra options of open restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active extra options of open restaurants" ON public.extra_options FOR SELECT USING (((active = true) AND (EXISTS ( SELECT 1
   FROM (public.extra_groups eg
     JOIN public.restaurants r ON ((r.id = eg.restaurant_id)))
  WHERE ((eg.id = extra_options.group_id) AND (r.is_open = true) AND (eg.active = true))))));


--
-- Name: products Public can view active products of open restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active products of open restaurants" ON public.products FOR SELECT USING (((active = true) AND (visible = true) AND (EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = products.restaurant_id) AND (r.is_open = true))))));


--
-- Name: coupons Public can view active visible coupons of open restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active visible coupons of open restaurants" ON public.coupons FOR SELECT USING (((active = true) AND (visible = true) AND ((expires_at IS NULL) OR (expires_at > now())) AND ((max_uses IS NULL) OR (used_count < max_uses)) AND (EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = coupons.restaurant_id) AND (r.is_open = true))))));


--
-- Name: restaurants Public can view open restaurants by slug; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view open restaurants by slug" ON public.restaurants FOR SELECT USING ((is_open = true));


--
-- Name: delivery_zones Public read access for delivery_zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for delivery_zones" ON public.delivery_zones FOR SELECT USING (true);


--
-- Name: operating_hours Public read access for operating_hours; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for operating_hours" ON public.operating_hours FOR SELECT USING (true);


--
-- Name: restaurant_settings Public read access for restaurant_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for restaurant_settings" ON public.restaurant_settings FOR SELECT USING (true);


--
-- Name: restaurants Resellers can create restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can create restaurants" ON public.restaurants FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: categories Resellers can delete categories of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can delete categories of their restaurants" ON public.categories FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = categories.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: coupons Resellers can delete coupons of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can delete coupons of their restaurants" ON public.coupons FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = coupons.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_groups Resellers can delete extra groups of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can delete extra groups of their restaurants" ON public.extra_groups FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = extra_groups.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_options Resellers can delete extra options of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can delete extra options of their restaurants" ON public.extra_options FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.extra_groups eg
     JOIN public.restaurants r ON ((r.id = eg.restaurant_id)))
  WHERE ((eg.id = extra_options.group_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: products Resellers can delete products of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can delete products of their restaurants" ON public.products FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = products.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: subscription_plans Resellers can delete their own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can delete their own plans" ON public.subscription_plans FOR DELETE USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: restaurants Resellers can delete their own restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can delete their own restaurants" ON public.restaurants FOR DELETE USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: categories Resellers can insert categories for their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert categories for their restaurants" ON public.categories FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = categories.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: coupons Resellers can insert coupons for their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert coupons for their restaurants" ON public.coupons FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = coupons.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_groups Resellers can insert extra groups for their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert extra groups for their restaurants" ON public.extra_groups FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = extra_groups.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_options Resellers can insert extra options for their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert extra options for their restaurants" ON public.extra_options FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.extra_groups eg
     JOIN public.restaurants r ON ((r.id = eg.restaurant_id)))
  WHERE ((eg.id = extra_options.group_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: subscription_payments Resellers can insert payments for their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert payments for their restaurants" ON public.subscription_payments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.restaurant_subscriptions rs
     JOIN public.restaurants r ON ((r.id = rs.restaurant_id)))
  WHERE ((rs.id = subscription_payments.subscription_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: products Resellers can insert products for their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert products for their restaurants" ON public.products FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = products.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: restaurant_subscriptions Resellers can insert subscriptions for their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert subscriptions for their restaurants" ON public.restaurant_subscriptions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = restaurant_subscriptions.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: subscription_plans Resellers can insert their own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert their own plans" ON public.subscription_plans FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: reseller_settings Resellers can insert their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can insert their own settings" ON public.reseller_settings FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: categories Resellers can update categories of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update categories of their restaurants" ON public.categories FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = categories.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: coupons Resellers can update coupons of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update coupons of their restaurants" ON public.coupons FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = coupons.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_groups Resellers can update extra groups of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update extra groups of their restaurants" ON public.extra_groups FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = extra_groups.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_options Resellers can update extra options of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update extra options of their restaurants" ON public.extra_options FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.extra_groups eg
     JOIN public.restaurants r ON ((r.id = eg.restaurant_id)))
  WHERE ((eg.id = extra_options.group_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: subscription_payments Resellers can update payments of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update payments of their restaurants" ON public.subscription_payments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.restaurant_subscriptions rs
     JOIN public.restaurants r ON ((r.id = rs.restaurant_id)))
  WHERE ((rs.id = subscription_payments.subscription_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: products Resellers can update products of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update products of their restaurants" ON public.products FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = products.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: restaurant_subscriptions Resellers can update subscriptions of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update subscriptions of their restaurants" ON public.restaurant_subscriptions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = restaurant_subscriptions.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: subscription_plans Resellers can update their own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update their own plans" ON public.subscription_plans FOR UPDATE USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: restaurants Resellers can update their own restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update their own restaurants" ON public.restaurants FOR UPDATE USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: reseller_settings Resellers can update their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update their own settings" ON public.reseller_settings FOR UPDATE USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: categories Resellers can view categories of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view categories of their restaurants" ON public.categories FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = categories.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: coupons Resellers can view coupons of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view coupons of their restaurants" ON public.coupons FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = coupons.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_groups Resellers can view extra groups of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view extra groups of their restaurants" ON public.extra_groups FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = extra_groups.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: extra_options Resellers can view extra options of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view extra options of their restaurants" ON public.extra_options FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.extra_groups eg
     JOIN public.restaurants r ON ((r.id = eg.restaurant_id)))
  WHERE ((eg.id = extra_options.group_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: subscription_payments Resellers can view payments of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view payments of their restaurants" ON public.subscription_payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.restaurant_subscriptions rs
     JOIN public.restaurants r ON ((r.id = rs.restaurant_id)))
  WHERE ((rs.id = subscription_payments.subscription_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: products Resellers can view products of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view products of their restaurants" ON public.products FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = products.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: restaurant_subscriptions Resellers can view subscriptions of their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view subscriptions of their restaurants" ON public.restaurant_subscriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.restaurants r
  WHERE ((r.id = restaurant_subscriptions.restaurant_id) AND (r.reseller_id = auth.uid())))));


--
-- Name: subscription_plans Resellers can view their own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view their own plans" ON public.subscription_plans FOR SELECT USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: restaurants Resellers can view their own restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view their own restaurants" ON public.restaurants FOR SELECT USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: reseller_settings Resellers can view their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view their own settings" ON public.reseller_settings FOR SELECT USING ((public.has_role(auth.uid(), 'reseller'::public.app_role) AND (reseller_id = auth.uid())));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_options ENABLE ROW LEVEL SECURITY;

--
-- Name: operating_hours; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reseller_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reseller_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;