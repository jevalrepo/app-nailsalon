-- Fix trigger: el cast a user_role falla cuando app_metadata viene vacío
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
  v_role_text text;
BEGIN
  v_role_text := NEW.raw_app_meta_data->>'role';

  IF v_role_text = 'admin' THEN
    v_role := 'admin';
  ELSE
    v_role := 'employee';
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
