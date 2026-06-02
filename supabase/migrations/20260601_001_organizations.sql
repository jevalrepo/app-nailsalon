-- ============================================================
-- SAAS S1 — Organizaciones (salones)
-- ============================================================

-- Tabla principal de salones registrados en el SaaS
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Membresías: qué usuarios pertenecen a qué salón y con qué rol
-- Nota: el rol 'owner' es nuevo; 'admin' y 'employee' mantienen su semántica actual
CREATE TABLE organization_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'employee')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  invited_by       UUID REFERENCES auth.users(id),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Invitaciones por email (usadas en Módulo S7)
CREATE TABLE invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  token            TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  accepted_at      TIMESTAMPTZ,
  invited_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_org_members_user_id   ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id    ON organization_members(organization_id);
CREATE INDEX idx_invitations_token     ON invitations(token);
CREATE INDEX idx_invitations_email     ON invitations(email);
CREATE INDEX idx_invitations_org_id    ON invitations(organization_id);
