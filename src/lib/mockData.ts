// Mock data + fluent Supabase-like client for demo mode
import type {
  Amenity,
  Bill,
  Booking,
  Complaint,
  Expense,
  Notice,
  Payment,
  SocietySettings,
  SosAlert,
  Unit,
  Visitor,
} from '@/types';

type Row = Record<string, unknown>;

export const mockUnits: Unit[] = [
  {
    id: '1',
    unit_number: 'A-101',
    owner_name: 'Rajesh Kumar',
    phone: '9876543210',
    floor: 1,
    area_sqft: 1200,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    unit_number: 'A-102',
    owner_name: 'Priya Sharma',
    phone: '9876543211',
    floor: 1,
    area_sqft: 1100,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    unit_number: 'A-103',
    owner_name: 'Amit Patel',
    phone: '9876543212',
    floor: 1,
    area_sqft: 1150,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    unit_number: 'B-201',
    owner_name: 'Sneha Gupta',
    phone: '9876543213',
    floor: 2,
    area_sqft: 1300,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    unit_number: 'B-202',
    owner_name: 'Vikram Singh',
    phone: '9876543214',
    floor: 2,
    area_sqft: 1250,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const mockSettings: SocietySettings = {
  id: '1',
  name: 'Navya Naman Vatika',
  upi_id: 'navyanaman@upi',
  payee_name: 'Navya Naman Vatika',
  bank_name: 'HDFC Bank',
  account_number: '1234567890',
  ifsc: 'HDFC0001234',
  monthly_rate_per_sqft: 3,
  late_fee_per_day: 5,
  due_day_of_month: 10,
  created_at: '2026-01-01T00:00:00.000Z',
};

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();
const dueDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-10`;
const createdAt = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01T00:00:00.000Z`;

export const mockBills: Bill[] = [
  {
    id: '1',
    unit_id: '1',
    period_month: currentMonth,
    period_year: currentYear,
    base_amount: 3600,
    late_fee: 0,
    total_amount: 3600,
    status: 'paid',
    due_date: dueDate,
    created_at: createdAt,
  },
  {
    id: '2',
    unit_id: '2',
    period_month: currentMonth,
    period_year: currentYear,
    base_amount: 3300,
    late_fee: 0,
    total_amount: 3300,
    status: 'pending',
    due_date: dueDate,
    created_at: createdAt,
  },
  {
    id: '3',
    unit_id: '3',
    period_month: currentMonth,
    period_year: currentYear,
    base_amount: 3450,
    late_fee: 40,
    total_amount: 3490,
    status: 'overdue',
    due_date: dueDate,
    created_at: createdAt,
  },
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    bill_id: '1',
    unit_id: '1',
    amount: 3600,
    method: 'upi',
    reference_no: 'UPI123456',
    paid_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-05T10:00:00.000Z`,
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-05T10:00:00.000Z`,
  },
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    category: 'maintenance',
    amount: 15000,
    description: 'Lift maintenance',
    expense_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15T00:00:00.000Z`,
  },
  {
    id: '2',
    category: 'security',
    amount: 8000,
    description: 'Security guard salary',
    expense_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15T00:00:00.000Z`,
  },
];

export const mockNotices: Notice[] = [
  {
    id: '1',
    title: 'Annual General Meeting',
    body: 'Annual General Meeting will be held on 25th of this month at 6 PM in the community hall.',
    priority: 'urgent',
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-20T00:00:00.000Z`,
  },
  {
    id: '2',
    title: 'Water Tank Cleaning',
    body: 'Water tank cleaning scheduled for this weekend. Please store water accordingly.',
    priority: 'normal',
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-18T00:00:00.000Z`,
  },
];

export const mockSosAlerts: SosAlert[] = [
  {
    id: '1',
    unit_id: '1',
    alert_type: 'medical',
    message: 'Medical emergency in A-101',
    status: 'resolved',
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-25T00:00:00.000Z`,
    resolved_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-25T01:00:00.000Z`,
  },
];

export const mockComplaints: Complaint[] = [
  {
    id: '1',
    unit_id: '1',
    category: 'plumbing',
    description: 'Water leakage in bathroom',
    status: 'open',
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-28T00:00:00.000Z`,
    resolved_at: null,
  },
  {
    id: '2',
    unit_id: '2',
    category: 'electrical',
    description: 'Light not working in corridor',
    status: 'resolved',
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-25T00:00:00.000Z`,
    resolved_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-26T00:00:00.000Z`,
  },
];

export const mockVisitors: Visitor[] = [
  {
    id: '1',
    visitor_name: 'John Doe',
    purpose: 'personal',
    host_unit_id: '1',
    entry_time: `${currentYear}-${String(currentMonth).padStart(2, '0')}-18T10:00:00.000Z`,
    exit_time: `${currentYear}-${String(currentMonth).padStart(2, '0')}-18T12:00:00.000Z`,
    status: 'checked_out',
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-18T10:00:00.000Z`,
  },
];

export const mockAmenities: Amenity[] = [
  {
    id: '1',
    name: 'Community Hall',
    description: 'Large hall for events and meetings',
    capacity: 100,
    hourly_rate: 500,
    is_active: true,
  },
  {
    id: '2',
    name: 'Gym',
    description: 'Fitness center',
    capacity: 20,
    hourly_rate: 0,
    is_active: true,
  },
];

export const mockBookings: Booking[] = [
  {
    id: '1',
    amenity_id: '1',
    unit_id: '1',
    booking_date: `${currentYear}-${String(Math.min(currentMonth + 1, 12)).padStart(2, '0')}-15`,
    start_time: '18:00',
    end_time: '22:00',
    status: 'confirmed',
    created_at: `${currentYear}-${String(currentMonth).padStart(2, '0')}-18T00:00:00.000Z`,
  },
];

const store: Record<string, Row[]> = {
  units: mockUnits.map((u) => ({ ...u })),
  society_settings: [{ ...mockSettings }],
  bills: mockBills.map((b) => ({ ...b })),
  payments: mockPayments.map((p) => ({ ...p })),
  expenses: mockExpenses.map((e) => ({ ...e })),
  notices: mockNotices.map((n) => ({ ...n })),
  sos_alerts: mockSosAlerts.map((a) => ({ ...a })),
  complaints: mockComplaints.map((c) => ({ ...c })),
  visitors: mockVisitors.map((v) => ({ ...v })),
  amenities: mockAmenities.map((a) => ({ ...a })),
  bookings: mockBookings.map((b) => ({ ...b })),
};

function cloneRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r }));
}

function nextId(table: string): string {
  const rows = store[table] ?? [];
  const max = rows.reduce((m, r) => {
    const n = Number(r.id);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return String(max + 1);
}

type Filter = { column: string; op: 'eq' | 'lt'; value: unknown };
type Order = { column: string; ascending: boolean };

class MockQueryBuilder implements PromiseLike<{ data: unknown; error: null }> {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: Filter[] = [];
  private orderBy: Order | null = null;
  private limitCount: number | null = null;
  private payload: Row | Row[] | null = null;
  private wantSingle = false;
  private wantMaybeSingle = false;
  private returnRows = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    void columns;
    if (this.action === 'insert' || this.action === 'update') {
      this.returnRows = true;
    } else {
      this.action = 'select';
    }
    return this;
  }

  insert(values: Row | Row[]) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values: Row) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, op: 'lt', value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: opts?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) =>
      this.filters.every((f) => {
        const v = row[f.column];
        if (f.op === 'eq') return v === f.value;
        if (f.op === 'lt') return String(v) < String(f.value);
        return true;
      }),
    );
  }

  private execute(): { data: unknown; error: null } {
    if (!store[this.table]) store[this.table] = [];

    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const created = items.map((item) => {
        const row: Row = {
          ...item,
          id: item.id ?? nextId(this.table),
          created_at: item.created_at ?? new Date().toISOString(),
        };
        store[this.table].push(row);
        return { ...row };
      });
      const data = this.wantSingle || this.wantMaybeSingle ? created[0] ?? null : created;
      return { data: this.returnRows || this.wantSingle || this.wantMaybeSingle ? data : null, error: null };
    }

    if (this.action === 'update') {
      const matched = this.applyFilters(store[this.table]);
      matched.forEach((row) => Object.assign(row, this.payload ?? {}));
      const data = this.wantSingle || this.wantMaybeSingle ? cloneRows(matched)[0] ?? null : cloneRows(matched);
      return { data: this.returnRows || this.wantSingle || this.wantMaybeSingle ? data : null, error: null };
    }

    if (this.action === 'delete') {
      const before = store[this.table];
      store[this.table] = before.filter(
        (row) =>
          !this.filters.every((f) => {
            const v = row[f.column];
            if (f.op === 'eq') return v === f.value;
            if (f.op === 'lt') return String(v) < String(f.value);
            return true;
          }),
      );
      return { data: null, error: null };
    }

    let rows = this.applyFilters(store[this.table]);

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = [...rows].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av) < String(bv) ? -1 : 1;
        return ascending ? cmp : -cmp;
      });
    }

    if (this.limitCount != null) {
      rows = rows.slice(0, this.limitCount);
    }

    const cloned = cloneRows(rows);
    if (this.wantSingle) return { data: cloned[0] ?? null, error: null };
    if (this.wantMaybeSingle) return { data: cloned[0] ?? null, error: null };
    return { data: cloned, error: null };
  }

  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

export const mockSupabase = {
  from: (table: string) => new MockQueryBuilder(table),
  auth: {
    signInWithOAuth: async () => ({ error: null }),
    signInWithOtp: async () => ({ error: null }),
    verifyOtp: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};
