export type SocietySettings = {
  id: string;
  name: string;
  upi_id: string;
  payee_name: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  monthly_rate_per_sqft: number;
  late_fee_per_day: number;
  due_day_of_month: number;
  created_at: string;
};

export type Unit = {
  id: string;
  unit_number: string;
  owner_name: string;
  phone: string | null;
  floor: number;
  area_sqft: number;
  is_active: boolean;
  created_at: string;
};

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export type Bill = {
  id: string;
  unit_id: string;
  period_month: number;
  period_year: number;
  base_amount: number;
  late_fee: number;
  total_amount: number;
  due_date: string;
  status: BillStatus;
  created_at: string;
};

export type PaymentMethod = 'upi' | 'cash' | 'bank_transfer' | 'cheque';

export type Payment = {
  id: string;
  bill_id: string | null;
  unit_id: string;
  amount: number;
  method: PaymentMethod;
  reference_no: string | null;
  paid_at: string;
  created_at: string;
};

export type Expense = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  created_at: string;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  created_at: string;
};

export type VisitorStatus = 'pending' | 'approved' | 'checked_in' | 'checked_out' | 'denied';

export type Visitor = {
  id: string;
  visitor_name: string;
  purpose: string | null;
  host_unit_id: string | null;
  entry_time: string | null;
  exit_time: string | null;
  status: VisitorStatus;
  created_at: string;
};

export type Amenity = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  hourly_rate: number;
  is_active: boolean;
};

export type Booking = {
  id: string;
  amenity_id: string;
  unit_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
};

export type SosAlert = {
  id: string;
  unit_id: string;
  alert_type: string;
  message: string | null;
  status: 'active' | 'resolved';
  created_at: string;
  resolved_at: string | null;
};

export type Complaint = {
  id: string;
  unit_id: string;
  category: 'plumbing' | 'electrical' | 'cleaning' | 'security' | 'other' | 'general';
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at: string | null;
};

export type Role = 'admin' | 'resident' | 'guard';

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: Role;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ChatThread = {
  id: string;
  unit_id: string;
  unit_number: string;
  owner_name: string;
  owner_phone: string | null;
  last_message: ChatMessage | null;
  unread_count: number;
  updated_at: string;
  created_at: string;
};
