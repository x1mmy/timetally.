


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calculate_break_minutes"("p_client_id" "uuid", "p_total_hours" numeric) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_break_minutes INTEGER := 0;
BEGIN
  -- Find the applicable break rule (highest min_hours that's strictly
  -- less than total_hours — a shift of exactly min_hours does NOT
  -- trigger that tier's break).
  SELECT break_minutes INTO v_break_minutes
  FROM break_rules
  WHERE client_id = p_client_id
    AND min_hours < p_total_hours
  ORDER BY min_hours DESC
  LIMIT 1;

  -- Return 0 if no rule found
  RETURN COALESCE(v_break_minutes, 0);
END;
$$;


ALTER FUNCTION "public"."calculate_break_minutes"("p_client_id" "uuid", "p_total_hours" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_timesheet_hours"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_raw_hours DECIMAL(5,2);
  v_apply_breaks BOOLEAN;
  v_has_logged_breaks BOOLEAN;
BEGIN
  IF NEW.end_time IS NULL THEN
    NEW.total_hours := 0;
    RETURN NEW;
  END IF;

  IF NEW.client_id IS NULL THEN
    SELECT client_id INTO NEW.client_id
    FROM employees WHERE id = NEW.employee_id;
  END IF;

  v_raw_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;

  SELECT EXISTS(
    SELECT 1 FROM timesheet_breaks
    WHERE timesheet_id = NEW.id AND break_end_time IS NOT NULL
  ) INTO v_has_logged_breaks;

  IF NOT v_has_logged_breaks THEN
    SELECT apply_break_rules INTO v_apply_breaks
    FROM employees WHERE id = NEW.employee_id;

    IF v_apply_breaks = true AND NEW.break_minutes IS NULL THEN
      NEW.break_minutes := calculate_break_minutes(NEW.client_id, v_raw_hours);
    ELSIF v_apply_breaks = false THEN
      NEW.break_minutes := 0;
    END IF;
  END IF;

  NEW.total_hours := v_raw_hours - (COALESCE(NEW.break_minutes, 0) / 60.0);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_timesheet_hours"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_timesheet_break_minutes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_timesheet_id UUID;
  v_completed_count INTEGER;
  v_total_minutes INTEGER;
BEGIN
  v_timesheet_id := COALESCE(NEW.timesheet_id, OLD.timesheet_id);

  SELECT COUNT(*), COALESCE(SUM(EXTRACT(EPOCH FROM (break_end_time - break_start_time)) / 60), 0)
  INTO v_completed_count, v_total_minutes
  FROM timesheet_breaks
  WHERE timesheet_id = v_timesheet_id
    AND break_end_time IS NOT NULL;

  -- Only override break_minutes while at least one logged break exists;
  -- otherwise leave it NULL so the rule-based estimate applies.
  IF v_completed_count > 0 THEN
    UPDATE timesheets SET break_minutes = v_total_minutes WHERE id = v_timesheet_id;
  ELSE
    UPDATE timesheets SET break_minutes = NULL WHERE id = v_timesheet_id;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_timesheet_break_minutes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."break_rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "min_hours" numeric(4,2) NOT NULL,
    "break_minutes" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."break_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_name" character varying(255) NOT NULL,
    "subdomain" character varying(63) NOT NULL,
    "contact_email" character varying(255) NOT NULL,
    "manager_pin" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "clients_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::"text"[])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "dashboard_view" "text" DEFAULT 'weekly'::"text" NOT NULL,
    "clock_in_rounding_minutes" integer DEFAULT 0 NOT NULL,
    "allow_break_logging" boolean DEFAULT false NOT NULL,
    CONSTRAINT "employee_categories_clock_in_rounding_minutes_check" CHECK (("clock_in_rounding_minutes" = ANY (ARRAY[0, 5, 10, 15, 30]))),
    CONSTRAINT "employee_categories_dashboard_view_check" CHECK (("dashboard_view" = ANY (ARRAY['weekly'::"text", 'today_only'::"text"])))
);


ALTER TABLE "public"."employee_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "pin" character varying(4) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "weekday_rate" numeric(10,2) NOT NULL,
    "saturday_rate" numeric(10,2) NOT NULL,
    "sunday_rate" numeric(10,2) NOT NULL,
    "pay_type" character varying(20) DEFAULT 'hourly'::character varying NOT NULL,
    "apply_break_rules" boolean DEFAULT true NOT NULL,
    "public_holiday_rate" numeric DEFAULT 0 NOT NULL,
    "category_id" "uuid",
    CONSTRAINT "employees_pay_type_check" CHECK ((("pay_type")::"text" = ANY ((ARRAY['hourly'::character varying, 'day_rate'::character varying])::"text"[]))),
    CONSTRAINT "employees_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timesheet_breaks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "timesheet_id" "uuid" NOT NULL,
    "break_start_time" time without time zone NOT NULL,
    "break_end_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."timesheet_breaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timesheet_edit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "timesheet_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "work_date" "date" NOT NULL,
    "action" character varying(20) NOT NULL,
    "edited_at" timestamp with time zone DEFAULT "now"(),
    "edited_by" character varying(20) NOT NULL,
    "previous_start_time" time without time zone,
    "previous_end_time" time without time zone,
    "new_start_time" time without time zone,
    "new_end_time" time without time zone,
    CONSTRAINT "timesheet_edit_log_action_check" CHECK ((("action")::"text" = ANY ((ARRAY['edit'::character varying, 'delete'::character varying])::"text"[]))),
    CONSTRAINT "timesheet_edit_log_edited_by_check" CHECK ((("edited_by")::"text" = ANY ((ARRAY['employee'::character varying, 'manager'::character varying])::"text"[])))
);


ALTER TABLE "public"."timesheet_edit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timesheets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "work_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone,
    "break_minutes" integer,
    "total_hours" numeric(5,2) NOT NULL,
    "notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "original_start_time" "text",
    "original_end_time" "text"
);


ALTER TABLE "public"."timesheets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."break_rules"
    ADD CONSTRAINT "break_rules_client_id_min_hours_key" UNIQUE ("client_id", "min_hours");



ALTER TABLE ONLY "public"."break_rules"
    ADD CONSTRAINT "break_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_subdomain_key" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."employee_categories"
    ADD CONSTRAINT "employee_categories_client_id_name_key" UNIQUE ("client_id", "name");



ALTER TABLE ONLY "public"."employee_categories"
    ADD CONSTRAINT "employee_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_client_pin_key" UNIQUE ("client_id", "pin");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timesheet_breaks"
    ADD CONSTRAINT "timesheet_breaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timesheet_edit_log"
    ADD CONSTRAINT "timesheet_edit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timesheets"
    ADD CONSTRAINT "timesheets_employee_id_work_date_key" UNIQUE ("employee_id", "work_date");



ALTER TABLE ONLY "public"."timesheets"
    ADD CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_users_email" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "idx_break_rules_client_id" ON "public"."break_rules" USING "btree" ("client_id");



CREATE INDEX "idx_clients_status" ON "public"."clients" USING "btree" ("status");



CREATE INDEX "idx_clients_subdomain" ON "public"."clients" USING "btree" ("subdomain");



CREATE INDEX "idx_employees_client_id" ON "public"."employees" USING "btree" ("client_id");



CREATE INDEX "idx_employees_client_pin" ON "public"."employees" USING "btree" ("client_id", "pin");



CREATE INDEX "idx_employees_status" ON "public"."employees" USING "btree" ("status");



CREATE INDEX "idx_timesheet_breaks_timesheet_id" ON "public"."timesheet_breaks" USING "btree" ("timesheet_id");



CREATE INDEX "idx_timesheet_edit_log_client_id" ON "public"."timesheet_edit_log" USING "btree" ("client_id");



CREATE INDEX "idx_timesheet_edit_log_edited_at" ON "public"."timesheet_edit_log" USING "btree" ("edited_at" DESC);



CREATE INDEX "idx_timesheet_edit_log_employee_id" ON "public"."timesheet_edit_log" USING "btree" ("employee_id");



CREATE INDEX "idx_timesheet_edit_log_work_date" ON "public"."timesheet_edit_log" USING "btree" ("work_date");



CREATE INDEX "idx_timesheets_client_date" ON "public"."timesheets" USING "btree" ("client_id", "work_date");



CREATE INDEX "idx_timesheets_client_id" ON "public"."timesheets" USING "btree" ("client_id");



CREATE INDEX "idx_timesheets_employee_id" ON "public"."timesheets" USING "btree" ("employee_id");



CREATE INDEX "idx_timesheets_work_date" ON "public"."timesheets" USING "btree" ("work_date");



CREATE OR REPLACE TRIGGER "calculate_hours_before_insert" BEFORE INSERT ON "public"."timesheets" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_timesheet_hours"();



CREATE OR REPLACE TRIGGER "calculate_hours_before_update" BEFORE UPDATE ON "public"."timesheets" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_timesheet_hours"();



CREATE OR REPLACE TRIGGER "sync_break_minutes_on_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."timesheet_breaks" FOR EACH ROW EXECUTE FUNCTION "public"."sync_timesheet_break_minutes"();



CREATE OR REPLACE TRIGGER "update_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_timesheets_updated_at" BEFORE UPDATE ON "public"."timesheets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."break_rules"
    ADD CONSTRAINT "break_rules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_categories"
    ADD CONSTRAINT "employee_categories_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."employee_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timesheet_breaks"
    ADD CONSTRAINT "timesheet_breaks_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timesheet_edit_log"
    ADD CONSTRAINT "timesheet_edit_log_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timesheet_edit_log"
    ADD CONSTRAINT "timesheet_edit_log_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timesheet_edit_log"
    ADD CONSTRAINT "timesheet_edit_log_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."timesheets"
    ADD CONSTRAINT "timesheets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timesheets"
    ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE "public"."break_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timesheet_breaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timesheets" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."calculate_break_minutes"("p_client_id" "uuid", "p_total_hours" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_break_minutes"("p_client_id" "uuid", "p_total_hours" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_break_minutes"("p_client_id" "uuid", "p_total_hours" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_timesheet_hours"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_timesheet_hours"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_timesheet_hours"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_timesheet_break_minutes"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_timesheet_break_minutes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_timesheet_break_minutes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."break_rules" TO "anon";
GRANT ALL ON TABLE "public"."break_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."break_rules" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."employee_categories" TO "anon";
GRANT ALL ON TABLE "public"."employee_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_categories" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."timesheet_breaks" TO "anon";
GRANT ALL ON TABLE "public"."timesheet_breaks" TO "authenticated";
GRANT ALL ON TABLE "public"."timesheet_breaks" TO "service_role";



GRANT ALL ON TABLE "public"."timesheet_edit_log" TO "anon";
GRANT ALL ON TABLE "public"."timesheet_edit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."timesheet_edit_log" TO "service_role";



GRANT ALL ON TABLE "public"."timesheets" TO "anon";
GRANT ALL ON TABLE "public"."timesheets" TO "authenticated";
GRANT ALL ON TABLE "public"."timesheets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































