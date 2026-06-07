-- Migration: 20260604140000_payment_early_discount
-- Descuento por pago anticipado (pronto pago) a nivel de hito de pago.
-- paid_amount sigue siendo el dinero realmente recibido; discount_amount guarda
-- cuánto se descontó por pronto pago (informativo y para reportes).

alter table payment_schedules
  add column if not exists discount_amount numeric(12,2) not null default 0;
