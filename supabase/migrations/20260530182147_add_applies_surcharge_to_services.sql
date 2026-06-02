-- Agrega columna applies_surcharge a services:
-- indica si este servicio aplica el recargo fuera de horario configurado en business_config.
alter table services add column if not exists applies_surcharge boolean not null default false;

-- También agrega off_hours_surcharge_type a business_config para diferenciar % vs monto fijo.
alter table business_config add column if not exists off_hours_surcharge_type text not null default 'fixed'
  check (off_hours_surcharge_type in ('fixed', 'percent'));
