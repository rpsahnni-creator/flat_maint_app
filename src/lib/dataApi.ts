import { api, unwrapList } from './api';
import type {
  Amenity,
  Bill,
  Booking,
  ChatMessage,
  ChatThread,
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
    const { data } = await api.post('/bills/generate/', { period_month, period_year });
    // New API returns { bills, count, emails_sent }; older shape was a bare array
    if (Array.isArray(data)) return data;
    return (data?.bills ?? []) as Bill[];
  },
  async emailBillPdf(id: string, email?: string): Promise<{ sent: boolean; email?: string; reason?: string }> {
    const { data } = await api.post(`/bills/${id}/email-pdf/`, email ? { email } : {});
    return data;
  },

  async listPayments(): Promise<Payment[]> {
    const { data } = await api.get('/payments/');
    return unwrapList<Payment>(data);
  },
  async createPayment(payload: Partial<Payment> & { email?: string }): Promise<Payment & {
    email_sent?: boolean;
    email_to?: string | null;
    email_reason?: string | null;
    pdf_url?: string;
  }> {
    const { data } = await api.post('/payments/', payload);
    return data;
  },
  async downloadPaymentPdf(id: string, filename?: string): Promise<void> {
    const { data } = await api.get(`/payments/${id}/pdf/`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? `receipt-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
  async downloadBillPdf(id: string, filename?: string): Promise<void> {
    const { data } = await api.get(`/bills/${id}/pdf/`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? `bill-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
  async resendPaymentEmail(id: string, email?: string): Promise<{ sent: boolean; email?: string; reason?: string }> {
    const { data } = await api.post(`/payments/${id}/resend-email/`, email ? { email } : {});
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

  async listChatThreads(): Promise<ChatThread[]> {
    const { data } = await api.get('/chat-threads/');
    return unwrapList<ChatThread>(data);
  },
  async openChatThread(unit_id: string): Promise<ChatThread> {
    const { data } = await api.post<ChatThread>('/chat-threads/open/', { unit_id });
    return data;
  },
  async listChatMessages(threadId: string): Promise<ChatMessage[]> {
    const { data } = await api.get(`/chat-threads/${threadId}/messages/`);
    return unwrapList<ChatMessage>(data);
  },
  async sendChatMessage(threadId: string, body: string): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(`/chat-threads/${threadId}/messages/`, { body });
    return data;
  },
};
