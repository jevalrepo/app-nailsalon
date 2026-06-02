-- ============================================================
-- SAAS S1 — Seed: organización inicial para datos existentes
-- Ejecutar DESPUÉS de 20260601_003_migrate_business_config.sql
-- ============================================================
-- Este script crea la org "Coraline Nails", asigna al admin
-- actual como owner, y liga todos los datos existentes a esa org.
-- ============================================================

DO $$
DECLARE
  v_org_id   UUID;
  v_admin_id UUID;
BEGIN
  -- Obtener el UUID del usuario admin actual
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'valdezgzz.22@gmail.com';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario valdezgzz.22@gmail.com en auth.users';
  END IF;

  -- Crear la organización principal
  INSERT INTO organizations (name, slug, plan)
  VALUES ('Coraline Nails', 'coraline-nails', 'pro')
  RETURNING id INTO v_org_id;

  -- Registrar al admin como owner del salón
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_admin_id, 'owner');

  -- Asignar todos los datos existentes a esta org
  UPDATE profiles       SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE clients        SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE services       SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE appointments   SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE transactions   SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE inventory      SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE designs        SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE tasks          SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE agenda_blocks  SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE business_config SET organization_id = v_org_id WHERE organization_id IS NULL;

  RAISE NOTICE 'Organización creada: % (ID: %)', 'Coraline Nails', v_org_id;
  RAISE NOTICE 'Admin asignado como owner: %', v_admin_id;
END $$;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Después de ejecutar, corre esto para confirmar que todo quedó bien:
--
-- SELECT o.name, o.slug, o.plan,
--        COUNT(DISTINCT m.user_id) AS members,
--        COUNT(DISTINCT c.id)      AS clients,
--        COUNT(DISTINCT s.id)      AS services
-- FROM organizations o
-- LEFT JOIN organization_members m ON m.organization_id = o.id
-- LEFT JOIN clients c              ON c.organization_id = o.id
-- LEFT JOIN services s             ON s.organization_id = o.id
-- GROUP BY o.id, o.name, o.slug, o.plan;
