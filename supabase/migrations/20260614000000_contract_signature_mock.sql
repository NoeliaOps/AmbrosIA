-- Migration: 20260614000000_contract_signature_mock
-- Campos para el flujo de FIRMA DIGITAL de contratos.
-- ⚠️ Por ahora la firma se opera en modo MOCK (showcase). Cuando se integre el PSC
-- real (decisión: Mifiel — ver project-pending memoria), estos mismos campos se
-- llenan desde el webhook del proveedor; `signature_provider` pasará de 'mock' a 'mifiel'.
--   status (existente): borrador → enviado → firmado
--   signed_at (existente): fecha/hora de firma
alter table contracts add column if not exists signature_provider text;           -- 'mock' | 'mifiel'
alter table contracts add column if not exists signer_name text;                  -- firmante (cliente)
alter table contracts add column if not exists signer_email text;
alter table contracts add column if not exists nom151_folio text;                 -- folio de la constancia NOM-151
alter table contracts add column if not exists signature_hash text;               -- hash de integridad del documento
alter table contracts add column if not exists signature_audit jsonb not null default '[]'::jsonb;  -- rastro de auditoría
