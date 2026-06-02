-- Permite a cualquier empleada autenticada insertar transacciones
-- vinculadas a una cita (generadas automáticamente al completar/pagar).
-- Los admins ya tienen acceso total via transactions_admin_all.
CREATE POLICY "transactions_employee_insert" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    appointment_id IS NOT NULL
    AND created_by = (SELECT auth.uid())
  );

-- Reemplaza la política de SELECT existente para incluir a empleadas
-- que ven sus propias transacciones generadas automáticamente.
DROP POLICY IF EXISTS "transactions_admin_all" ON transactions;

CREATE POLICY "transactions_admin_all" ON transactions
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
