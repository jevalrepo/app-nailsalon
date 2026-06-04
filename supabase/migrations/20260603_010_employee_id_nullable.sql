-- Allow appointments to exist without an assigned employee (e.g. after employee deletion)
ALTER TABLE appointments
  ALTER COLUMN employee_id DROP NOT NULL;

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_employee_id_fkey;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE SET NULL;
