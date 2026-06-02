// Tipos base del dominio — se expanden módulo a módulo

export type UserRole = 'admin' | 'employee';

// SaaS multi-tenant
export type TenantRole = 'owner' | 'admin' | 'employee';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  logo_url: string | null;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: TenantRole;
  is_active: boolean;
  invited_by: string | null;
  joined_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthdate: string | null;
  notes: string | null;
  no_show_count: number;
  created_by: string;
  created_at: string;
}

export type ServiceCategory = 'manicure' | 'pedicure' | 'gel' | 'acrilico' | 'otro';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_min: number;
  category: ServiceCategory;
  is_active: boolean;
  applies_surcharge: boolean;
  created_at: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid';
export type RecurrenceType = 'none' | 'weekly' | 'biweekly';

export interface Appointment {
  id: string;
  client_id: string;
  employee_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  recurrence_type: RecurrenceType;
  recurrence_end_date: string | null;
  parent_appointment_id: string | null;
  created_at: string;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  price_snapshot: number;
}

export interface AgendaBlock {
  id: string;
  employee_id: string;
  starts_at: string;
  ends_at: string;
  reason: string;
  created_at: string;
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  payment_method: PaymentMethod;
  appointment_id: string | null;
  employee_id: string | null;
  date: string;
  created_by: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_stock: number;
  created_at: string;
}

export interface Design {
  id: string;
  title: string;
  image_url: string;
  tags: string[];
  uploaded_by: string;
  created_at: string;
}

export interface ClientPhoto {
  id: string;
  client_id: string;
  appointment_id: string | null;
  image_url: string;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
}

export type InvitationRole = 'admin' | 'employee';

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: InvitationRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by: string | null;
  created_at: string;
}
