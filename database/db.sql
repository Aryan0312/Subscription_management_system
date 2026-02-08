--
-- PostgreSQL database dump
--

\restrict s6B5ydpHSDumfO0gQ127YgOqk4UK3LV7MDtZOXfhXqyC0UlEwueEVJ1TCuVsIG1

-- Dumped from database version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)
-- Dumped by pg_dump version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)

-- Started on 2026-02-08 09:57:28 IST

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
-- TOC entry 961 (class 1247 OID 20834)
-- Name: product_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);


ALTER TYPE public.product_status_enum OWNER TO postgres;

--
-- TOC entry 958 (class 1247 OID 20826)
-- Name: product_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_type_enum AS ENUM (
    'SERVICE',
    'PHYSICAL',
    'DIGITAL'
);


ALTER TYPE public.product_type_enum OWNER TO postgres;

--
-- TOC entry 267 (class 1255 OID 20799)
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number = 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('public.invoices_invoice_id_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_invoice_number() OWNER TO postgres;

--
-- TOC entry 266 (class 1255 OID 20798)
-- Name: generate_subscription_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_subscription_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.subscription_number IS NULL THEN
        NEW.subscription_number = 'SUB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('public.subscriptions_subscription_id_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_subscription_number() OWNER TO postgres;

--
-- TOC entry 268 (class 1255 OID 20800)
-- Name: update_invoice_on_payment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_invoice_on_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE public.invoices 
    SET amount_paid = amount_paid + NEW.amount,
        status = CASE 
            WHEN (amount_paid + NEW.amount) >= total_amount THEN 'PAID'
            ELSE status
        END,
        updated_at = now()
    WHERE invoice_id = NEW.invoice_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_invoice_on_payment() OWNER TO postgres;

--
-- TOC entry 265 (class 1255 OID 20797)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 260 (class 1259 OID 20939)
-- Name: attribute_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attribute_values (
    attribute_value_id integer NOT NULL,
    attribute_id integer NOT NULL,
    value text NOT NULL,
    extra_price numeric(10,2) DEFAULT 0,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.attribute_values OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 20938)
-- Name: attribute_values_attribute_value_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attribute_values_attribute_value_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attribute_values_attribute_value_id_seq OWNER TO postgres;

--
-- TOC entry 3837 (class 0 OID 0)
-- Dependencies: 259
-- Name: attribute_values_attribute_value_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attribute_values_attribute_value_id_seq OWNED BY public.attribute_values.attribute_value_id;


--
-- TOC entry 258 (class 1259 OID 20922)
-- Name: attributes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attributes (
    attribute_id integer NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.attributes OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 20921)
-- Name: attributes_attribute_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attributes_attribute_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attributes_attribute_id_seq OWNER TO postgres;

--
-- TOC entry 3838 (class 0 OID 0)
-- Dependencies: 257
-- Name: attributes_attribute_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attributes_attribute_id_seq OWNED BY public.attributes.attribute_id;


--
-- TOC entry 229 (class 1259 OID 20393)
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    contact_id integer NOT NULL,
    user_id integer NOT NULL,
    company_name character varying(200),
    billing_address jsonb,
    shipping_address jsonb,
    tax_id character varying(50),
    is_customer boolean DEFAULT true NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 20392)
-- Name: contacts_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.contacts ALTER COLUMN contact_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.contacts_contact_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 262 (class 1259 OID 21043)
-- Name: discounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discounts (
    discount_id integer NOT NULL,
    name character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    value numeric(12,2) NOT NULL,
    min_purchase numeric(12,2) DEFAULT 0,
    min_quantity integer DEFAULT 1,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discount_valid_date_range CHECK ((end_date >= start_date)),
    CONSTRAINT discounts_min_purchase_check CHECK ((min_purchase >= (0)::numeric)),
    CONSTRAINT discounts_min_quantity_check CHECK ((min_quantity >= 1)),
    CONSTRAINT discounts_type_check CHECK (((type)::text = ANY ((ARRAY['FIXED'::character varying, 'PERCENTAGE'::character varying])::text[]))),
    CONSTRAINT discounts_value_check CHECK ((value > (0)::numeric))
);


ALTER TABLE public.discounts OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 21042)
-- Name: discounts_discount_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.discounts ALTER COLUMN discount_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.discounts_discount_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 247 (class 1259 OID 20600)
-- Name: invoice_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_lines (
    invoice_line_id integer NOT NULL,
    invoice_id integer NOT NULL,
    description character varying(500) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invoice_lines OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 20599)
-- Name: invoice_lines_invoice_line_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_lines ALTER COLUMN invoice_line_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.invoice_lines_invoice_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 245 (class 1259 OID 20570)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    subscription_id integer NOT NULL,
    customer_id integer NOT NULL,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    period_start date,
    period_end date,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    amount_paid numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    sent_at timestamp with time zone,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'CONFIRMED'::character varying, 'PAID'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 20569)
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.invoices ALTER COLUMN invoice_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.invoices_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 254 (class 1259 OID 20868)
-- Name: password_reset_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_otps (
    otp_id integer NOT NULL,
    user_id integer NOT NULL,
    otp_hash text NOT NULL,
    purpose character varying(30) DEFAULT 'PASSWORD_RESET'::character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_otps OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 20867)
-- Name: password_reset_otps_otp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.password_reset_otps ALTER COLUMN otp_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.password_reset_otps_otp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 249 (class 1259 OID 20616)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    invoice_id integer NOT NULL,
    method character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_date date NOT NULL,
    reference_code character varying(100),
    status character varying(20) DEFAULT 'COMPLETED'::character varying NOT NULL,
    processed_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payments_method_check CHECK (((method)::text = ANY ((ARRAY['CREDIT_CARD'::character varying, 'BANK_TRANSFER'::character varying, 'CASH'::character varying, 'CHECK'::character varying, 'ONLINE'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'REFUNDED'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 20615)
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ALTER COLUMN payment_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payments_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 264 (class 1259 OID 21075)
-- Name: product_attribute_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_attribute_values (
    id integer NOT NULL,
    product_id integer NOT NULL,
    attribute_value_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_attribute_values OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 21074)
-- Name: product_attribute_values_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_attribute_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_attribute_values_id_seq OWNER TO postgres;

--
-- TOC entry 3839 (class 0 OID 0)
-- Dependencies: 263
-- Name: product_attribute_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_attribute_values_id_seq OWNED BY public.product_attribute_values.id;


--
-- TOC entry 256 (class 1259 OID 20893)
-- Name: product_plan_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_plan_prices (
    product_plan_price_id integer NOT NULL,
    product_id integer NOT NULL,
    plan_id integer NOT NULL,
    price numeric(12,2) NOT NULL,
    min_quantity integer DEFAULT 1,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_min_quantity CHECK ((min_quantity >= 1)),
    CONSTRAINT chk_price_non_negative CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.product_plan_prices OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 20892)
-- Name: product_plan_prices_product_plan_price_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_plan_prices_product_plan_price_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_plan_prices_product_plan_price_id_seq OWNER TO postgres;

--
-- TOC entry 3840 (class 0 OID 0)
-- Dependencies: 255
-- Name: product_plan_prices_product_plan_price_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_plan_prices_product_plan_price_id_seq OWNED BY public.product_plan_prices.product_plan_price_id;


--
-- TOC entry 231 (class 1259 OID 20409)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    name character varying(200) NOT NULL,
    type public.product_type_enum NOT NULL,
    sales_price numeric(12,2) NOT NULL,
    cost_price numeric(12,2) DEFAULT 0,
    is_recurring boolean DEFAULT true NOT NULL,
    status public.product_status_enum DEFAULT 'ACTIVE'::public.product_status_enum NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_cost_price_check CHECK ((cost_price >= (0)::numeric)),
    CONSTRAINT products_sales_price_check CHECK ((sales_price >= (0)::numeric)),
    CONSTRAINT products_status_check CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('INACTIVE'::character varying)::text, ('ARCHIVED'::character varying)::text]))),
    CONSTRAINT products_type_check CHECK (((type)::text = ANY (ARRAY[('SERVICE'::character varying)::text, ('PHYSICAL'::character varying)::text, ('DIGITAL'::character varying)::text])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 20408)
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.products ALTER COLUMN product_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.products_product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 20522)
-- Name: quotation_template_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_template_lines (
    template_line_id integer NOT NULL,
    template_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    discount_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quotation_template_lines_quantity_check CHECK ((quantity >= 1))
);


ALTER TABLE public.quotation_template_lines OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 20521)
-- Name: quotation_template_lines_template_line_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.quotation_template_lines ALTER COLUMN template_line_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quotation_template_lines_template_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 20511)
-- Name: quotation_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_templates (
    template_id integer NOT NULL,
    name character varying(200) NOT NULL,
    validity_days integer DEFAULT 30 NOT NULL,
    plan_id integer,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quotation_templates OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 20510)
-- Name: quotation_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.quotation_templates ALTER COLUMN template_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quotation_templates_template_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 233 (class 1259 OID 20443)
-- Name: recurring_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_plans (
    plan_id integer NOT NULL,
    name character varying(200) NOT NULL,
    price numeric(12,2) DEFAULT NULL::numeric,
    billing_period character varying(20) NOT NULL,
    min_quantity integer DEFAULT 1 NOT NULL,
    is_closable boolean DEFAULT true NOT NULL,
    is_pausable boolean DEFAULT false NOT NULL,
    is_renewable boolean DEFAULT true NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    auto_close_after_days integer,
    CONSTRAINT recurring_plans_billing_period_check CHECK (((billing_period)::text = ANY ((ARRAY['DAILY'::character varying, 'WEEKLY'::character varying, 'MONTHLY'::character varying, 'YEARLY'::character varying])::text[]))),
    CONSTRAINT recurring_plans_min_quantity_check CHECK ((min_quantity >= 1))
);


ALTER TABLE public.recurring_plans OWNER TO postgres;

--
-- TOC entry 3841 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN recurring_plans.price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_plans.price IS 'DEPRECATED: Pricing handled via product_plan_prices.';


--
-- TOC entry 3842 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN recurring_plans.min_quantity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_plans.min_quantity IS 'DEPRECATED: Quantity handled via product_plan_prices.';


--
-- TOC entry 3843 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN recurring_plans.auto_close_after_days; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_plans.auto_close_after_days IS 'If NULL, subscription never auto-closes. Otherwise, subscription auto-closes N days after plan end date.';


--
-- TOC entry 232 (class 1259 OID 20442)
-- Name: recurring_plans_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.recurring_plans ALTER COLUMN plan_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.recurring_plans_plan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 17980)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 3844 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.roles IS 'User roles: super_admin (full system), admin (internal operations), user (portal/customer)';


--
-- TOC entry 3845 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN roles.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.roles.name IS 'super_admin = Subscription Admin, admin = Internal User, user = Portal User/Customer';


--
-- TOC entry 223 (class 1259 OID 17979)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ALTER COLUMN role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 18014)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 20557)
-- Name: subscription_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_lines (
    line_id integer NOT NULL,
    subscription_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    tax_id integer,
    discount_id integer,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscription_lines_quantity_check CHECK ((quantity >= 1))
);


ALTER TABLE public.subscription_lines OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 20556)
-- Name: subscription_lines_line_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.subscription_lines ALTER COLUMN line_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.subscription_lines_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 20534)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    subscription_id integer NOT NULL,
    subscription_number character varying(50) NOT NULL,
    customer_id integer NOT NULL,
    plan_id integer NOT NULL,
    start_date date NOT NULL,
    expiration_date date,
    payment_terms integer DEFAULT 30 NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    next_billing_date date,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'QUOTATION'::character varying, 'CONFIRMED'::character varying, 'ACTIVE'::character varying, 'CLOSED'::character varying])::text[])))
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 20533)
-- Name: subscriptions_subscription_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.subscriptions ALTER COLUMN subscription_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.subscriptions_subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 20471)
-- Name: taxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.taxes (
    tax_id integer NOT NULL,
    name character varying(100) NOT NULL,
    region character varying(100) DEFAULT 'GLOBAL'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    calculation_type text NOT NULL,
    value numeric NOT NULL,
    CONSTRAINT calculation_type_check CHECK ((calculation_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text])))
);


ALTER TABLE public.taxes OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 20470)
-- Name: taxes_tax_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.taxes ALTER COLUMN tax_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.taxes_tax_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 17958)
-- Name: user_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_credentials (
    user_credentials_id integer NOT NULL,
    user_id integer NOT NULL,
    password text NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_attempt timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_credentials OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17957)
-- Name: user_credentials_user_credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_credentials ALTER COLUMN user_credentials_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_credentials_user_credentials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 17992)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_role_id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17991)
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ALTER COLUMN user_role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_roles_user_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 17942)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    fname character varying(100) NOT NULL,
    lname character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17941)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 250 (class 1259 OID 20809)
-- Name: v_dashboard_metrics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_dashboard_metrics AS
 SELECT ( SELECT count(*) AS count
           FROM public.subscriptions
          WHERE ((subscriptions.status)::text = 'ACTIVE'::text)) AS active_subscriptions,
    ( SELECT COALESCE(sum(s.total_amount), (0)::numeric) AS "coalesce"
           FROM (public.subscriptions s
             JOIN public.recurring_plans rp ON ((s.plan_id = rp.plan_id)))
          WHERE (((s.status)::text = 'ACTIVE'::text) AND ((rp.billing_period)::text = 'MONTHLY'::text))) AS monthly_recurring_revenue,
    ( SELECT COALESCE(sum((invoices.total_amount - invoices.amount_paid)), (0)::numeric) AS "coalesce"
           FROM public.invoices
          WHERE ((invoices.status)::text = ANY ((ARRAY['CONFIRMED'::character varying, 'DRAFT'::character varying])::text[]))) AS outstanding_invoices,
    ( SELECT count(*) AS count
           FROM public.invoices
          WHERE (((invoices.status)::text = 'CONFIRMED'::text) AND (invoices.due_date < CURRENT_DATE))) AS overdue_count;


ALTER VIEW public.v_dashboard_metrics OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 20819)
-- Name: v_invoice_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_invoice_summary AS
 SELECT i.invoice_id,
    i.invoice_number,
    i.status,
    s.subscription_number,
    u.email AS customer_email,
    i.issue_date,
    i.due_date,
    i.total_amount,
    i.amount_paid,
    (i.total_amount - i.amount_paid) AS balance_due,
        CASE
            WHEN ((i.due_date < CURRENT_DATE) AND ((i.status)::text <> 'PAID'::text)) THEN true
            ELSE false
        END AS is_overdue
   FROM (((public.invoices i
     JOIN public.subscriptions s ON ((i.subscription_id = s.subscription_id)))
     JOIN public.contacts c ON ((i.customer_id = c.contact_id)))
     JOIN public.users u ON ((c.user_id = u.user_id)));


ALTER VIEW public.v_invoice_summary OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 20814)
-- Name: v_subscription_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_subscription_details AS
 SELECT s.subscription_id,
    s.subscription_number,
    s.status,
    u.email AS customer_email,
    (((u.fname)::text || ' '::text) || (u.lname)::text) AS customer_name,
    c.company_name,
    p.name AS plan_name,
    p.billing_period,
    s.start_date,
    s.expiration_date,
    s.total_amount,
    s.next_billing_date
   FROM (((public.subscriptions s
     JOIN public.contacts c ON ((s.customer_id = c.contact_id)))
     JOIN public.users u ON ((c.user_id = u.user_id)))
     JOIN public.recurring_plans p ON ((s.plan_id = p.plan_id)));


ALTER VIEW public.v_subscription_details OWNER TO postgres;

--
-- TOC entry 3488 (class 2604 OID 20942)
-- Name: attribute_values attribute_value_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_values ALTER COLUMN attribute_value_id SET DEFAULT nextval('public.attribute_values_attribute_value_id_seq'::regclass);


--
-- TOC entry 3485 (class 2604 OID 20925)
-- Name: attributes attribute_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attributes ALTER COLUMN attribute_id SET DEFAULT nextval('public.attributes_attribute_id_seq'::regclass);


--
-- TOC entry 3496 (class 2604 OID 21078)
-- Name: product_attribute_values id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_values ALTER COLUMN id SET DEFAULT nextval('public.product_attribute_values_id_seq'::regclass);


--
-- TOC entry 3482 (class 2604 OID 20896)
-- Name: product_plan_prices product_plan_price_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_plan_prices ALTER COLUMN product_plan_price_id SET DEFAULT nextval('public.product_plan_prices_product_plan_price_id_seq'::regclass);


--
-- TOC entry 3827 (class 0 OID 20939)
-- Dependencies: 260
-- Data for Name: attribute_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attribute_values (attribute_value_id, attribute_id, value, extra_price, status, created_at, updated_at) FROM stdin;
1	3	Odoo	560.00	ARCHIVED	2026-02-08 03:49:00.258165	2026-02-08 04:01:33.206629
2	3	Shopify	400.00	ARCHIVED	2026-02-08 03:49:00.258165	2026-02-08 04:01:33.206629
3	3	128 GB	0.00	ACTIVE	2026-02-08 04:01:33.206629	\N
4	3	256 GB	1800.00	ACTIVE	2026-02-08 04:01:33.206629	\N
5	3	1 TB	5000.00	ACTIVE	2026-02-08 04:01:33.206629	\N
\.


--
-- TOC entry 3825 (class 0 OID 20922)
-- Dependencies: 258
-- Data for Name: attributes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attributes (attribute_id, name, status, created_at, updated_at) FROM stdin;
1	Brand	ACTIVE	2026-02-08 02:26:28.628799	2026-02-08 02:28:55.228883
3	goa	ACTIVE	2026-02-08 03:49:00.258165	2026-02-08 04:01:33.206629
\.


--
-- TOC entry 3799 (class 0 OID 20393)
-- Dependencies: 229
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (contact_id, user_id, company_name, billing_address, shipping_address, tax_id, is_customer, is_internal, created_at, updated_at) FROM stdin;
1	4	Super Admin Corp	{"zip": "400001", "city": "Mumbai", "street": "123 Admin St"}	{"zip": "400001", "city": "Mumbai", "street": "123 Admin St"}	GST123456	f	t	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
2	30	Company Admin Ltd	{"zip": "110001", "city": "Delhi", "street": "456 Office Rd"}	{"zip": "110001", "city": "Delhi", "street": "456 Office Rd"}	GST789012	f	t	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
3	31	Sales Department	{"zip": "560001", "city": "Bangalore", "street": "789 Sales Ave"}	{"zip": "560001", "city": "Bangalore", "street": "789 Sales Ave"}	GST345678	f	t	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
4	32	Acme Corporation	{"zip": "400051", "city": "Mumbai", "street": "100 Business Park"}	{"zip": "400051", "city": "Mumbai", "street": "100 Business Park"}	GST111111	t	f	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
5	33	TechStart Inc	{"zip": "500081", "city": "Hyderabad", "street": "200 Innovation Dr"}	{"zip": "500081", "city": "Hyderabad", "street": "200 Innovation Dr"}	GST222222	t	f	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
6	34	Global Solutions	{"zip": "411001", "city": "Pune", "street": "300 Enterprise Way"}	{"zip": "411001", "city": "Pune", "street": "300 Enterprise Way"}	GST333333	t	f	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
\.


--
-- TOC entry 3829 (class 0 OID 21043)
-- Dependencies: 262
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discounts (discount_id, name, type, value, min_purchase, min_quantity, start_date, end_date, is_active, created_by, created_at) FROM stdin;
2	NEWUSER10	PERCENTAGE	10.00	1000.00	1	2026-02-01	2026-03-01	t	4	2026-02-08 03:29:38.443594+05:30
1	NEWUSER10	PERCENTAGE	15.00	1000.00	1	2026-02-01	2028-07-15	f	4	2026-02-08 03:18:24.998917+05:30
\.


--
-- TOC entry 3817 (class 0 OID 20600)
-- Dependencies: 247
-- Data for Name: invoice_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_lines (invoice_line_id, invoice_id, description, quantity, unit_price, tax_rate, line_total, created_at) FROM stdin;
1	1	SaaS Basic Plan - Monthly	1	29.99	18.00	35.39	2026-02-07 13:50:27.709124+05:30
2	2	SaaS Pro Plan - Monthly	1	99.99	18.00	117.99	2026-02-07 13:50:27.709124+05:30
3	2	Premium Support - Monthly	1	49.99	18.00	58.99	2026-02-07 13:50:27.709124+05:30
4	3	SaaS Basic Plan - Annual (20% discount applied)	1	239.92	18.00	283.11	2026-02-07 13:50:27.709124+05:30
5	4	SaaS Basic Plan - Monthly	1	29.99	18.00	35.39	2026-02-07 13:50:27.709124+05:30
6	5	SaaS Pro Plan - Monthly	1	99.99	18.00	117.99	2026-02-07 13:50:27.709124+05:30
7	5	Premium Support - Monthly	1	49.99	18.00	58.99	2026-02-07 13:50:27.709124+05:30
8	6	SaaS Basic Plan - Monthly	1	29.99	18.00	35.39	2026-02-07 13:50:27.709124+05:30
\.


--
-- TOC entry 3815 (class 0 OID 20570)
-- Dependencies: 245
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (invoice_id, invoice_number, subscription_id, customer_id, issue_date, due_date, period_start, period_end, subtotal, tax_amount, discount_amount, total_amount, amount_paid, status, sent_at, created_by, created_at, updated_at) FROM stdin;
4	INV-2024-0004	1	4	2024-02-15	2024-03-16	2024-02-15	2024-03-14	29.99	5.40	0.00	35.39	0.00	CONFIRMED	2026-02-07 13:50:27.709124+05:30	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
5	INV-2024-0005	2	5	2024-02-20	2024-03-06	2024-02-20	2024-03-19	149.98	27.00	0.00	176.98	0.00	DRAFT	\N	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
1	INV-2024-0001	1	4	2024-01-15	2024-02-14	2024-01-15	2024-02-14	29.99	5.40	0.00	35.39	70.78	PAID	2026-02-07 13:50:27.709124+05:30	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
2	INV-2024-0002	2	5	2024-01-20	2024-02-04	2024-01-20	2024-02-19	149.98	27.00	0.00	176.98	353.96	PAID	2026-02-07 13:50:27.709124+05:30	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
3	INV-2024-0003	3	6	2024-02-01	2024-03-02	2024-02-01	2025-01-31	299.90	53.98	59.98	293.90	587.80	PAID	2026-02-07 13:50:27.709124+05:30	31	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
6	INV-2024-0006	5	4	2024-01-01	2024-01-31	2024-01-01	2024-01-31	29.99	5.40	0.00	35.39	70.78	PAID	2026-02-07 13:50:27.709124+05:30	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
\.


--
-- TOC entry 3821 (class 0 OID 20868)
-- Dependencies: 254
-- Data for Name: password_reset_otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_otps (otp_id, user_id, otp_hash, purpose, expires_at, used_at, attempts, max_attempts, created_at) FROM stdin;
1	40	$2b$10$PJ95G0jJTX9AjGyyt6ssjeh3pMG59Qd.EOKNVHzxY5xDOEg/u2Dim	PASSWORD_RESET	2026-02-07 18:49:44.128+05:30	2026-02-07 18:41:01.902839+05:30	0	5	2026-02-07 18:39:44.128759+05:30
\.


--
-- TOC entry 3819 (class 0 OID 20616)
-- Dependencies: 249
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (payment_id, invoice_id, method, amount, payment_date, reference_code, status, processed_by, created_at) FROM stdin;
1	1	CREDIT_CARD	35.39	2024-01-15	TXN001	COMPLETED	30	2026-02-07 13:50:27.709124+05:30
2	2	ONLINE	176.98	2024-01-21	TXN002	COMPLETED	30	2026-02-07 13:50:27.709124+05:30
3	3	BANK_TRANSFER	293.90	2024-02-02	TXN003	COMPLETED	31	2026-02-07 13:50:27.709124+05:30
4	6	CREDIT_CARD	35.39	2024-01-02	TXN004	COMPLETED	30	2026-02-07 13:50:27.709124+05:30
\.


--
-- TOC entry 3831 (class 0 OID 21075)
-- Dependencies: 264
-- Data for Name: product_attribute_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_attribute_values (id, product_id, attribute_value_id, created_at) FROM stdin;
\.


--
-- TOC entry 3823 (class 0 OID 20893)
-- Dependencies: 256
-- Data for Name: product_plan_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_plan_prices (product_plan_price_id, product_id, plan_id, price, min_quantity, start_date, end_date, created_at) FROM stdin;
1	1	1	29.99	1	2024-01-01	\N	2026-02-07 23:04:16.423944
2	1	2	299.90	1	2024-01-01	\N	2026-02-07 23:04:16.423944
3	2	3	99.99	1	2024-01-01	\N	2026-02-07 23:04:16.423944
4	2	4	999.90	1	2024-01-01	\N	2026-02-07 23:04:16.423944
5	6	1	49.99	1	2024-01-01	\N	2026-02-07 23:04:16.423944
6	1	1	29.99	1	2024-01-01	\N	2026-02-08 00:28:10.807898
\.


--
-- TOC entry 3801 (class 0 OID 20409)
-- Dependencies: 231
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, name, type, sales_price, cost_price, is_recurring, status, created_by, created_at, updated_at) FROM stdin;
1	SaaS Basic Plan	SERVICE	29.99	5.00	t	ACTIVE	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
2	SaaS Pro Plan	SERVICE	99.99	15.00	t	ACTIVE	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
3	SaaS Enterprise	SERVICE	299.99	50.00	t	ACTIVE	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
4	Consulting Hours	SERVICE	150.00	0.00	f	ACTIVE	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
6	Premium Support	SERVICE	49.99	10.00	t	ACTIVE	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 13:44:46.407566+05:30
7	Pro SaaS Plan	DIGITAL	999.00	150.00	t	ACTIVE	4	2026-02-07 21:30:30.046453+05:30	2026-02-07 21:30:30.046453+05:30
5	Pro SaaS Plan	DIGITAL	999.00	150.00	t	ARCHIVED	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 23:07:10.33076+05:30
\.


--
-- TOC entry 3809 (class 0 OID 20522)
-- Dependencies: 239
-- Data for Name: quotation_template_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_template_lines (template_line_id, template_id, product_id, quantity, discount_id, created_at) FROM stdin;
1	1	2	1	1	2026-02-07 13:44:46.407566+05:30
2	1	6	1	\N	2026-02-07 13:44:46.407566+05:30
3	2	3	1	4	2026-02-07 13:44:46.407566+05:30
4	3	1	1	1	2026-02-07 13:44:46.407566+05:30
\.


--
-- TOC entry 3807 (class 0 OID 20511)
-- Dependencies: 237
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_templates (template_id, name, validity_days, plan_id, created_by, created_at) FROM stdin;
1	Standard Pro Proposal	30	3	4	2026-02-07 13:44:46.407566+05:30
2	Enterprise Deal	45	5	4	2026-02-07 13:44:46.407566+05:30
3	Basic Starter Pack	14	1	4	2026-02-07 13:44:46.407566+05:30
\.


--
-- TOC entry 3803 (class 0 OID 20443)
-- Dependencies: 233
-- Data for Name: recurring_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_plans (plan_id, name, price, billing_period, min_quantity, is_closable, is_pausable, is_renewable, created_by, created_at, updated_at, auto_close_after_days) FROM stdin;
2	Basic Annual	\N	YEARLY	1	t	f	t	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 23:04:16.423944+05:30	\N
3	Pro Monthly	\N	MONTHLY	1	t	t	t	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 23:04:16.423944+05:30	\N
4	Pro Annual	\N	YEARLY	1	t	t	t	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 23:04:16.423944+05:30	\N
5	Enterprise Monthly	\N	MONTHLY	1	f	f	t	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 23:04:16.423944+05:30	\N
6	Support Add-on	\N	MONTHLY	1	t	t	t	4	2026-02-07 13:44:46.407566+05:30	2026-02-07 23:04:16.423944+05:30	\N
9	Trial	\N	MONTHLY	1	f	f	f	4	2026-02-07 23:41:11.876154+05:30	2026-02-07 23:41:11.876154+05:30	7
10	Trial	\N	MONTHLY	1	f	f	f	4	2026-02-07 23:46:47.695405+05:30	2026-02-07 23:46:47.695405+05:30	7
11	Trial	\N	MONTHLY	1	f	f	f	4	2026-02-07 23:53:24.688816+05:30	2026-02-07 23:53:24.688816+05:30	7
1	Trial	\N	MONTHLY	1	f	f	f	4	2026-02-07 13:44:46.407566+05:30	2026-02-08 00:06:49.454905+05:30	7
\.


--
-- TOC entry 3794 (class 0 OID 17980)
-- Dependencies: 224
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, name, created_at) FROM stdin;
1	super_admin	2026-02-05 00:53:12.279818+05:30
2	admin	2026-02-05 00:53:12.279818+05:30
3	user	2026-02-05 00:53:12.279818+05:30
\.


--
-- TOC entry 3797 (class 0 OID 18014)
-- Dependencies: 227
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
JB5fyszLEi2ZsC11vn3n6Ccf0suDodjH	{"cookie":{"originalMaxAge":14400000,"expires":"2026-02-08T00:07:10.516Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"user_id":4,"email":"aryan26zzz@gmail.com","fname":"Aryan","lname":"Shrivastav","role":"super_admin"}}	2026-02-08 08:04:38
V6pdq7hCJ6GazQTusg9D76EcyyrMuwM_	{"cookie":{"originalMaxAge":14400000,"expires":"2026-02-08T04:55:55.984Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"user_id":4,"email":"aryan26zzz@gmail.com","fname":"Aryan","lname":"Shrivastav","role":"super_admin"}}	2026-02-08 11:23:22
\.


--
-- TOC entry 3813 (class 0 OID 20557)
-- Dependencies: 243
-- Data for Name: subscription_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_lines (line_id, subscription_id, product_id, variant_id, quantity, unit_price, tax_id, discount_id, amount, created_at) FROM stdin;
1	1	1	\N	1	29.99	1	\N	35.39	2026-02-07 13:50:27.709124+05:30
2	2	2	1	1	99.99	1	\N	117.99	2026-02-07 13:50:27.709124+05:30
3	2	6	\N	1	49.99	1	\N	58.99	2026-02-07 13:50:27.709124+05:30
4	3	1	\N	1	299.90	1	1	271.91	2026-02-07 13:50:27.709124+05:30
5	4	3	3	5	299.99	1	4	13599.43	2026-02-07 13:50:27.709124+05:30
6	5	1	\N	1	29.99	1	\N	35.39	2026-02-07 13:50:27.709124+05:30
\.


--
-- TOC entry 3811 (class 0 OID 20534)
-- Dependencies: 241
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (subscription_id, subscription_number, customer_id, plan_id, start_date, expiration_date, payment_terms, status, total_amount, next_billing_date, created_by, created_at, updated_at) FROM stdin;
2	SUB-2024-0002	5	3	2024-01-20	\N	15	ACTIVE	99.99	2024-02-20	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
3	SUB-2024-0003	6	2	2024-02-01	2025-02-01	30	ACTIVE	299.90	2025-02-01	31	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
4	SUB-2024-0004	4	5	2024-02-10	\N	30	CONFIRMED	1499.95	\N	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
5	SUB-2024-0005	5	1	2024-01-01	2024-01-31	30	CLOSED	29.99	\N	30	2026-02-07 13:50:27.709124+05:30	2026-02-07 13:50:27.709124+05:30
6	SUB-2024-0006	4	2	2026-02-10	\N	30	DRAFT	0.00	\N	4	2026-02-08 07:21:46.45589+05:30	2026-02-08 07:21:46.45589+05:30
1	SUB-2024-0001	4	1	2024-01-15	\N	30	ACTIVE	29.99	2024-02-15	30	2026-02-07 13:50:27.709124+05:30	2026-02-08 07:23:21.335292+05:30
\.


--
-- TOC entry 3805 (class 0 OID 20471)
-- Dependencies: 235
-- Data for Name: taxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.taxes (tax_id, name, region, is_active, created_by, created_at, calculation_type, value) FROM stdin;
2	GST 5%	India-Special	t	4	2026-02-07 13:44:46.407566+05:30	PERCENTAGE	5.00
3	VAT 20%	UK	t	4	2026-02-07 13:44:46.407566+05:30	PERCENTAGE	20.00
4	Sales Tax 8%	USA	t	4	2026-02-07 13:44:46.407566+05:30	PERCENTAGE	8.00
6	GST 18%	India	t	4	2026-02-08 02:57:12.582562+05:30	PERCENTAGE	18.00
1	Eco Fee	India	t	4	2026-02-07 13:44:46.407566+05:30	FIXED	100
7	GST	India	t	4	2026-02-08 03:13:46.012298+05:30	PERCENTAGE	18
\.


--
-- TOC entry 3792 (class 0 OID 17958)
-- Dependencies: 222
-- Data for Name: user_credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_credentials (user_credentials_id, user_id, password, is_locked, attempts, last_attempt, created_at) FROM stdin;
30	30	$2b$12$UKJJaALT4a0EG/IRbothQO59bAo7XdLEWSzzge.z/l3Pu5HtUA9te	f	0	\N	2026-02-07 13:44:30.497602+05:30
31	31	$2b$12$UKJJaALT4a0EG/IRbothQO59bAo7XdLEWSzzge.z/l3Pu5HtUA9te	f	0	\N	2026-02-07 13:44:30.497602+05:30
32	32	$2b$12$UKJJaALT4a0EG/IRbothQO59bAo7XdLEWSzzge.z/l3Pu5HtUA9te	f	0	\N	2026-02-07 13:44:30.497602+05:30
33	33	$2b$12$UKJJaALT4a0EG/IRbothQO59bAo7XdLEWSzzge.z/l3Pu5HtUA9te	f	0	\N	2026-02-07 13:44:30.497602+05:30
34	34	$2b$12$UKJJaALT4a0EG/IRbothQO59bAo7XdLEWSzzge.z/l3Pu5HtUA9te	f	0	\N	2026-02-07 13:44:30.497602+05:30
38	38	$2b$12$NDUDF4pNWB.hitex4I9Axu4HROeOoWH0NmPbeVIO4mbDACi.AdoYS	f	0	2026-02-07 15:03:09.108275+05:30	2026-02-07 14:15:55.942491+05:30
40	40	$2b$12$cToSYxsggjFCiqEH1mOjQeQPYK0a4MXGs6KdoMWOm9zI6wc/l3g4u	f	0	\N	2026-02-07 15:16:05.653428+05:30
4	4	$2b$12$UKJJaALT4a0EG/IRbothQO59bAo7XdLEWSzzge.z/l3Pu5HtUA9te	f	0	2026-02-08 06:25:55.637787+05:30	2026-02-05 00:57:11.054677+05:30
\.


--
-- TOC entry 3796 (class 0 OID 17992)
-- Dependencies: 226
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_role_id, user_id, role_id, created_at) FROM stdin;
1	4	1	2026-02-05 00:57:11.054677+05:30
7	30	2	2026-02-07 13:44:30.497602+05:30
8	31	2	2026-02-07 13:44:30.497602+05:30
9	32	3	2026-02-07 13:44:30.497602+05:30
10	33	3	2026-02-07 13:44:30.497602+05:30
11	34	3	2026-02-07 13:44:30.497602+05:30
14	38	3	2026-02-07 14:15:55.942491+05:30
16	40	1	2026-02-07 15:16:05.653428+05:30
\.


--
-- TOC entry 3790 (class 0 OID 17942)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, email, phone, fname, lname, created_at) FROM stdin;
4	aryan26zzz@gmail.com	\N	Aryan	Shrivastav	2026-02-05 00:57:11.054677+05:30
30	admin@company.com	+1234567890	John	Admin	2026-02-07 13:44:30.497602+05:30
31	sales@company.com	+1234567891	Jane	Sales	2026-02-07 13:44:30.497602+05:30
32	customer1@example.com	+1234567892	Alice	Customer	2026-02-07 13:44:30.497602+05:30
33	customer2@example.com	+1234567893	Bob	Client	2026-02-07 13:44:30.497602+05:30
34	customer3@example.com	+1234567894	Carol	User	2026-02-07 13:44:30.497602+05:30
38	aryanshrivastav.dev@gmail.com	+918200746094	Aryan	Shrivastav	2026-02-07 14:15:55.942491+05:30
40	solankibhavesh1304@gmail.com	+919979491587	Bhavesh	Solanki	2026-02-07 15:16:05.653428+05:30
\.


--
-- TOC entry 3846 (class 0 OID 0)
-- Dependencies: 259
-- Name: attribute_values_attribute_value_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attribute_values_attribute_value_id_seq', 6, true);


--
-- TOC entry 3847 (class 0 OID 0)
-- Dependencies: 257
-- Name: attributes_attribute_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attributes_attribute_id_seq', 4, true);


--
-- TOC entry 3848 (class 0 OID 0)
-- Dependencies: 228
-- Name: contacts_contact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contacts_contact_id_seq', 6, true);


--
-- TOC entry 3849 (class 0 OID 0)
-- Dependencies: 261
-- Name: discounts_discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discounts_discount_id_seq', 2, true);


--
-- TOC entry 3850 (class 0 OID 0)
-- Dependencies: 246
-- Name: invoice_lines_invoice_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_lines_invoice_line_id_seq', 8, true);


--
-- TOC entry 3851 (class 0 OID 0)
-- Dependencies: 244
-- Name: invoices_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_invoice_id_seq', 6, true);


--
-- TOC entry 3852 (class 0 OID 0)
-- Dependencies: 253
-- Name: password_reset_otps_otp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_otps_otp_id_seq', 1, true);


--
-- TOC entry 3853 (class 0 OID 0)
-- Dependencies: 248
-- Name: payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_payment_id_seq', 4, true);


--
-- TOC entry 3854 (class 0 OID 0)
-- Dependencies: 263
-- Name: product_attribute_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_attribute_values_id_seq', 1, false);


--
-- TOC entry 3855 (class 0 OID 0)
-- Dependencies: 255
-- Name: product_plan_prices_product_plan_price_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_plan_prices_product_plan_price_id_seq', 6, true);


--
-- TOC entry 3856 (class 0 OID 0)
-- Dependencies: 230
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_product_id_seq', 7, true);


--
-- TOC entry 3857 (class 0 OID 0)
-- Dependencies: 238
-- Name: quotation_template_lines_template_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_template_lines_template_line_id_seq', 4, true);


--
-- TOC entry 3858 (class 0 OID 0)
-- Dependencies: 236
-- Name: quotation_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_templates_template_id_seq', 3, true);


--
-- TOC entry 3859 (class 0 OID 0)
-- Dependencies: 232
-- Name: recurring_plans_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurring_plans_plan_id_seq', 11, true);


--
-- TOC entry 3860 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 3, true);


--
-- TOC entry 3861 (class 0 OID 0)
-- Dependencies: 242
-- Name: subscription_lines_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscription_lines_line_id_seq', 6, true);


--
-- TOC entry 3862 (class 0 OID 0)
-- Dependencies: 240
-- Name: subscriptions_subscription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscriptions_subscription_id_seq', 6, true);


--
-- TOC entry 3863 (class 0 OID 0)
-- Dependencies: 234
-- Name: taxes_tax_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.taxes_tax_id_seq', 7, true);


--
-- TOC entry 3864 (class 0 OID 0)
-- Dependencies: 221
-- Name: user_credentials_user_credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_credentials_user_credentials_id_seq', 40, true);


--
-- TOC entry 3865 (class 0 OID 0)
-- Dependencies: 225
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_user_role_id_seq', 16, true);


--
-- TOC entry 3866 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 40, true);


--
-- TOC entry 3590 (class 2606 OID 20956)
-- Name: attribute_values attribute_values_attribute_id_value_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_values
    ADD CONSTRAINT attribute_values_attribute_id_value_key UNIQUE (attribute_id, value);


--
-- TOC entry 3592 (class 2606 OID 20954)
-- Name: attribute_values attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_values
    ADD CONSTRAINT attribute_values_pkey PRIMARY KEY (attribute_value_id);


--
-- TOC entry 3586 (class 2606 OID 20937)
-- Name: attributes attributes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_name_key UNIQUE (name);


--
-- TOC entry 3588 (class 2606 OID 20935)
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (attribute_id);


--
-- TOC entry 3539 (class 2606 OID 20633)
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (contact_id);


--
-- TOC entry 3594 (class 2606 OID 21065)
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (discount_id);


--
-- TOC entry 3574 (class 2606 OID 20655)
-- Name: invoice_lines invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_pkey PRIMARY KEY (invoice_line_id);


--
-- TOC entry 3570 (class 2606 OID 20598)
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 3572 (class 2606 OID 20653)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- TOC entry 3579 (class 2606 OID 20886)
-- Name: password_reset_otps password_reset_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_otps
    ADD CONSTRAINT password_reset_otps_pkey PRIMARY KEY (otp_id);


--
-- TOC entry 3577 (class 2606 OID 20657)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 3598 (class 2606 OID 21084)
-- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id);


--
-- TOC entry 3584 (class 2606 OID 20906)
-- Name: product_plan_prices product_plan_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_plan_prices
    ADD CONSTRAINT product_plan_prices_pkey PRIMARY KEY (product_plan_price_id);


--
-- TOC entry 3546 (class 2606 OID 20635)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 3554 (class 2606 OID 20647)
-- Name: quotation_template_lines quotation_template_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_template_lines
    ADD CONSTRAINT quotation_template_lines_pkey PRIMARY KEY (template_line_id);


--
-- TOC entry 3552 (class 2606 OID 20645)
-- Name: quotation_templates quotation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 3548 (class 2606 OID 20639)
-- Name: recurring_plans recurring_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_plans
    ADD CONSTRAINT recurring_plans_pkey PRIMARY KEY (plan_id);


--
-- TOC entry 3528 (class 2606 OID 17990)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 3530 (class 2606 OID 17988)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 3537 (class 2606 OID 18023)
-- Name: sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3565 (class 2606 OID 20651)
-- Name: subscription_lines subscription_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_lines
    ADD CONSTRAINT subscription_lines_pkey PRIMARY KEY (line_id);


--
-- TOC entry 3559 (class 2606 OID 20649)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (subscription_id);


--
-- TOC entry 3561 (class 2606 OID 20555)
-- Name: subscriptions subscriptions_subscription_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_subscription_number_key UNIQUE (subscription_number);


--
-- TOC entry 3550 (class 2606 OID 20641)
-- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT taxes_pkey PRIMARY KEY (tax_id);


--
-- TOC entry 3600 (class 2606 OID 21086)
-- Name: product_attribute_values unique_product_attribute_value; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT unique_product_attribute_value UNIQUE (product_id, attribute_value_id);


--
-- TOC entry 3563 (class 2606 OID 21098)
-- Name: subscriptions unique_subscription_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT unique_subscription_number UNIQUE (subscription_number);


--
-- TOC entry 3542 (class 2606 OID 20659)
-- Name: contacts unique_user_contact; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT unique_user_contact UNIQUE (user_id);


--
-- TOC entry 3532 (class 2606 OID 18003)
-- Name: user_roles unique_user_role; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT unique_user_role UNIQUE (user_id, role_id);


--
-- TOC entry 3526 (class 2606 OID 17973)
-- Name: user_credentials user_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_pkey PRIMARY KEY (user_credentials_id);


--
-- TOC entry 3534 (class 2606 OID 18001)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_role_id);


--
-- TOC entry 3520 (class 2606 OID 17954)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3522 (class 2606 OID 17956)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3524 (class 2606 OID 17952)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3535 (class 1259 OID 18024)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- TOC entry 3540 (class 1259 OID 20785)
-- Name: idx_contacts_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_customer ON public.contacts USING btree (is_customer) WHERE (is_customer = true);


--
-- TOC entry 3595 (class 1259 OID 21071)
-- Name: idx_discounts_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discounts_active ON public.discounts USING btree (is_active);


--
-- TOC entry 3596 (class 1259 OID 21072)
-- Name: idx_discounts_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discounts_dates ON public.discounts USING btree (start_date, end_date);


--
-- TOC entry 3566 (class 1259 OID 20794)
-- Name: idx_invoices_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_customer ON public.invoices USING btree (customer_id);


--
-- TOC entry 3567 (class 1259 OID 20795)
-- Name: idx_invoices_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date);


--
-- TOC entry 3568 (class 1259 OID 20793)
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- TOC entry 3575 (class 1259 OID 20796)
-- Name: idx_payments_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_invoice ON public.payments USING btree (invoice_id);


--
-- TOC entry 3580 (class 1259 OID 20920)
-- Name: idx_ppp_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ppp_dates ON public.product_plan_prices USING btree (start_date, end_date);


--
-- TOC entry 3581 (class 1259 OID 20919)
-- Name: idx_ppp_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ppp_plan ON public.product_plan_prices USING btree (plan_id);


--
-- TOC entry 3582 (class 1259 OID 20918)
-- Name: idx_ppp_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ppp_product ON public.product_plan_prices USING btree (product_id);


--
-- TOC entry 3543 (class 1259 OID 20787)
-- Name: idx_products_recurring; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_recurring ON public.products USING btree (is_recurring);


--
-- TOC entry 3544 (class 1259 OID 20849)
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- TOC entry 3555 (class 1259 OID 20791)
-- Name: idx_subscriptions_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_customer ON public.subscriptions USING btree (customer_id);


--
-- TOC entry 3556 (class 1259 OID 20792)
-- Name: idx_subscriptions_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_dates ON public.subscriptions USING btree (start_date, expiration_date);


--
-- TOC entry 3557 (class 1259 OID 20790)
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- TOC entry 3636 (class 2620 OID 20807)
-- Name: invoices trigger_generate_invoice_number; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_generate_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();


--
-- TOC entry 3634 (class 2620 OID 20806)
-- Name: subscriptions trigger_generate_subscription_number; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_generate_subscription_number BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.generate_subscription_number();


--
-- TOC entry 3638 (class 2620 OID 20808)
-- Name: payments trigger_update_invoice_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_invoice_payment AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_invoice_on_payment();


--
-- TOC entry 3631 (class 2620 OID 20801)
-- Name: contacts update_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3637 (class 2620 OID 20805)
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3633 (class 2620 OID 20803)
-- Name: recurring_plans update_plans_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.recurring_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3632 (class 2620 OID 20802)
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3635 (class 2620 OID 20804)
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3627 (class 2606 OID 20957)
-- Name: attribute_values attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_values
    ADD CONSTRAINT attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(attribute_id) ON DELETE CASCADE;


--
-- TOC entry 3604 (class 2606 OID 20660)
-- Name: contacts fk_contacts_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT fk_contacts_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3628 (class 2606 OID 21066)
-- Name: discounts fk_discounts_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT fk_discounts_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3621 (class 2606 OID 20770)
-- Name: invoice_lines fk_invoice_lines_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT fk_invoice_lines_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id) ON DELETE CASCADE;


--
-- TOC entry 3618 (class 2606 OID 20765)
-- Name: invoices fk_invoices_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3619 (class 2606 OID 20760)
-- Name: invoices fk_invoices_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES public.contacts(contact_id);


--
-- TOC entry 3620 (class 2606 OID 20755)
-- Name: invoices fk_invoices_subscription; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(subscription_id);


--
-- TOC entry 3615 (class 2606 OID 20735)
-- Name: subscription_lines fk_lines_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_lines
    ADD CONSTRAINT fk_lines_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- TOC entry 3616 (class 2606 OID 20730)
-- Name: subscription_lines fk_lines_subscription; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_lines
    ADD CONSTRAINT fk_lines_subscription FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(subscription_id) ON DELETE CASCADE;


--
-- TOC entry 3617 (class 2606 OID 20745)
-- Name: subscription_lines fk_lines_tax; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_lines
    ADD CONSTRAINT fk_lines_tax FOREIGN KEY (tax_id) REFERENCES public.taxes(tax_id);


--
-- TOC entry 3624 (class 2606 OID 20887)
-- Name: password_reset_otps fk_password_reset_otps_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_otps
    ADD CONSTRAINT fk_password_reset_otps_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3629 (class 2606 OID 21092)
-- Name: product_attribute_values fk_pav_attribute_value; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT fk_pav_attribute_value FOREIGN KEY (attribute_value_id) REFERENCES public.attribute_values(attribute_value_id) ON DELETE CASCADE;


--
-- TOC entry 3630 (class 2606 OID 21087)
-- Name: product_attribute_values fk_pav_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT fk_pav_product FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- TOC entry 3622 (class 2606 OID 20775)
-- Name: payments fk_payments_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- TOC entry 3623 (class 2606 OID 20780)
-- Name: payments fk_payments_processed_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_processed_by FOREIGN KEY (processed_by) REFERENCES public.users(user_id);


--
-- TOC entry 3606 (class 2606 OID 20675)
-- Name: recurring_plans fk_plans_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_plans
    ADD CONSTRAINT fk_plans_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3625 (class 2606 OID 20912)
-- Name: product_plan_prices fk_ppp_plan; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_plan_prices
    ADD CONSTRAINT fk_ppp_plan FOREIGN KEY (plan_id) REFERENCES public.recurring_plans(plan_id);


--
-- TOC entry 3626 (class 2606 OID 20907)
-- Name: product_plan_prices fk_ppp_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_plan_prices
    ADD CONSTRAINT fk_ppp_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- TOC entry 3605 (class 2606 OID 20665)
-- Name: products fk_products_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3612 (class 2606 OID 20725)
-- Name: subscriptions fk_subscriptions_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3613 (class 2606 OID 20715)
-- Name: subscriptions fk_subscriptions_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_customer FOREIGN KEY (customer_id) REFERENCES public.contacts(contact_id);


--
-- TOC entry 3614 (class 2606 OID 20720)
-- Name: subscriptions fk_subscriptions_plan; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES public.recurring_plans(plan_id);


--
-- TOC entry 3607 (class 2606 OID 20680)
-- Name: taxes fk_taxes_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT fk_taxes_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3610 (class 2606 OID 20705)
-- Name: quotation_template_lines fk_template_lines_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_template_lines
    ADD CONSTRAINT fk_template_lines_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- TOC entry 3611 (class 2606 OID 20700)
-- Name: quotation_template_lines fk_template_lines_template; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_template_lines
    ADD CONSTRAINT fk_template_lines_template FOREIGN KEY (template_id) REFERENCES public.quotation_templates(template_id) ON DELETE CASCADE;


--
-- TOC entry 3608 (class 2606 OID 20695)
-- Name: quotation_templates fk_templates_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT fk_templates_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3609 (class 2606 OID 20690)
-- Name: quotation_templates fk_templates_plan; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT fk_templates_plan FOREIGN KEY (plan_id) REFERENCES public.recurring_plans(plan_id);


--
-- TOC entry 3601 (class 2606 OID 17974)
-- Name: user_credentials fk_user_credentials_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3602 (class 2606 OID 18009)
-- Name: user_roles fk_user_roles_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 3603 (class 2606 OID 18004)
-- Name: user_roles fk_user_roles_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2026-02-08 09:57:28 IST

--
-- PostgreSQL database dump complete
--

\unrestrict s6B5ydpHSDumfO0gQ127YgOqk4UK3LV7MDtZOXfhXqyC0UlEwueEVJ1TCuVsIG1

