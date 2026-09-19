import { api, unwrapList } from './api';
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

export const dataApi = {
  async getSettings(): Promise<SocietySettings | null> {
    const { data } = await api.get<SocietySettings | null>('/society-settings/');
    return data;
  },
  async saveSettings(payload: Partial<SocietySettings>): Promise<SocietySettings> {
    const { data } = await api.put<SocietySettings>('/society-settings/', payload);
    return data;
  },

  async listUnits(activeOnly = false): Promise<Unit[]> {
    const q = activeOnly ? '?is_active=true' : '';
    const { data } = await api.get(`/units/${q}`);
    return unwrapList<Unit>(data);
  },
  async createUnit(payload: Partial<Unit>): Promise<Unit> {
    const { data } = await api.post<Unit>('/units/', payload);
    return data;
  },
  async updateUnit(id: string, payload: Partial<Unit>): Promise<Unit> {
    const { data } = await api.patch<Unit>(`/units/${id}/`, payload);
    return data;
  },

  async listBills(): Promise<Bill[]> {
    const { data } = await api.get('/bills/');
    return unwrapList<Bill>(data);
  },
  async generateBills(period_month: number, period_year: number): Promise<Bill[]> {
    const { data } = await api.post<Bill[]>('/bills/generate/', { period_month, period_year });
    return data;
  },

  async listPayments(): Promise<Payment[]> {
    const { data } = await api.get('/payments/');
    return unwrapList<Payment>(data);
  },
  async createPayment(payload: Partial<Payment>): Promise<Payment> {
    const { data } = await api.post<Payment>('/payments/', payload);
    return data;
  },

  async listExpenses(): Promise<Expense[]> {
    const { data } = await api.get('/expenses/');
    return unwrapList<Expense>(data);
  },
  async createExpense(payload: Partial<Expense>): Promise<Expense> {
    const { data } = await api.post<Expense>('/expenses/', payload);
    return data;
  },
  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}/`);
  },

  async listNotices(): Promise<Notice[]> {
    const { data } = await api.get('/notices/');
    return unwrapList<Notice>(data);
  },
  async createNotice(payload: Partial<Notice>): Promise<Notice> {
    const { data } = await api.post<Notice>('/notices/', payload);
    return data;
  },
  async deleteNotice(id: string): Promise<void> {
    await api.delete(`/notices/${id}/`);
  },

  async listVisitors(): Promise<Visitor[]> {
    const { data } = await api.get('/visitors/');
    return unwrapList<Visitor>(data);
  },
  async createVisitor(payload: Partial<Visitor>): Promise<Visitor> {
    const { data } = await api.post<Visitor>('/visitors/', payload);
    return data;
  },
  async updateVisitor(id: string, payload: Partial<Visitor>): Promise<Visitor> {
    const { data } = await api.patch<Visitor>(`/visitors/${id}/`, payload);
    return data;
  },

  async listAmenities(): Promise<Amenity[]> {
    const { data } = await api.get('/amenities/?is_active=true');
    return unwrapList<Amenity>(data);
  },
  async listBookings(): Promise<Booking[]> {
    const { data } = await api.get('/bookings/');
    return unwrapList<Booking>(data);
  },
  async createBooking(payload: Partial<Booking>): Promise<Booking> {
    const { data } = await api.post<Booking>('/bookings/', payload);
    return data;
  },
  async updateBooking(id: string, payload: Partial<Booking>): Promise<Booking> {
    const { data } = await api.patch<Booking>(`/bookings/${id}/`, payload);
    return data;
  },

  async listSosAlerts(status?: string): Promise<SosAlert[]> {
    const q = status ? `?status=${status}` : '';
    const { data } = await api.get(`/sos-alerts/${q}`);
    return unwrapList<SosAlert>(data);
  },
  async createSos(payload: Partial<SosAlert>): Promise<SosAlert> {
    const { data } = await api.post<SosAlert>('/sos-alerts/', payload);
    return data;
  },
  async updateSos(id: string, payload: Partial<SosAlert>): Promise<SosAlert> {
    const { data } = await api.patch<SosAlert>(`/sos-alerts/${id}/`, payload);
    return data;
  },

  async listComplaints(): Promise<Complaint[]> {
    const { data } = await api.get('/complaints/');
    return unwrapList<Complaint>(data);
  },
  async createComplaint(payload: Partial<Complaint>): Promise<Complaint> {
    const { data } = await api.post<Complaint>('/complaints/', payload);
    return data;
  },
  async updateComplaint(id: string, payload: Partial<Complaint>): Promise<Complaint> {
    const { data } = await api.patch<Complaint>(`/complaints/${id}/`, payload);
    return data;
  },

  async dashboard() {
    const { data } = await api.get('/dashboard/');
    return data;
  },
};
