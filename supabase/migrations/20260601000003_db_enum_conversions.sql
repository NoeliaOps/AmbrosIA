-- Migration: 20260601000003_db_enum_conversions
-- Convert status columns from unconstrained text to the enum types defined
-- in the initial schema. Must drop defaults first, alter, then restore.

alter table events alter column status drop default;
alter table quotes alter column status drop default;
alter table payment_schedules alter column status drop default;
alter table requisitions alter column status drop default;
alter table purchase_orders alter column status drop default;

alter table events alter column status type event_status using status::event_status;
alter table quotes alter column status type quote_status using status::quote_status;
alter table payment_schedules alter column status type payment_status using status::payment_status;
alter table requisitions alter column status type requisition_status using status::requisition_status;
alter table purchase_orders alter column status type po_status using status::po_status;

alter table events alter column status set default 'cotizado'::event_status;
alter table quotes alter column status set default 'borrador'::quote_status;
alter table payment_schedules alter column status set default 'pendiente'::payment_status;
alter table requisitions alter column status set default 'generada'::requisition_status;
alter table purchase_orders alter column status set default 'pendiente'::po_status;
