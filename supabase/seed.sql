-- Seed users for local development (password for all: MiaTest123!).
-- One user per plan so every tier can be tried without Google.

do $$
declare
  seed record;
  v_id uuid;
begin
  for seed in
    select * from (values
      ('free@mia.test',     'Usuario Free',     'free'),
      ('extended@mia.test', 'Usuario Extended', 'extended'),
      ('pro@mia.test',      'Usuario Pro',      'pro')
    ) as t(email, display_name, plan)
  loop
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, email_change_confirm_status, reauthentication_token,
      phone_change, phone_change_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      seed.email, crypt('MiaTest123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', seed.display_name, 'email_verified', true),
      now(), now(),
      '', '', '', '', '', 0, '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', seed.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    -- The on_auth_user_created trigger already created the profile; set its plan.
    update public.profiles set plan = seed.plan::public.plan_tier where id = v_id;
  end loop;
end;
$$;
