import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Input, Select, EmptyState } from '@/components/ui';
import { formatCurrency, formatDateTime, formatDate, monthLabel } from '@/lib/utils';
import type { Bill, Payment, Unit, PaymentMethod, BillStatus } from '@/types';
import { Wallet, QrCode, Download, CheckCircle2, Plus, Search, AlertCircle } from 'lucide-react';

export function Payments({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { role, currentUnit, units, settings } = useApp();
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [qrBill, setQrBill] = useState<Bill | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Record payment form
  const [recUnitId, setRecUnitId] = useState('');
  const [recBillId, setRecBillId] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recMethod, setRecMethod] = useState<PaymentMethod>('upi');
  const [recRef, setRecRef] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [unitsData, billsData, payData] = await Promise.all([
          dataApi.listUnits(),
          dataApi.listBills(),
          dataApi.listPayments(),
        ]);
        const map: Record<string, Unit> = {};
        unitsData.forEach((u) => { map[u.id] = u; });
        setUnitsMap(map);
        setBills(
          [...billsData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        );
        setPayments(
          [...payData].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()),
        );
      } catch {
        setError('Could not load payments. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function amountPaidForBill(billId: string): number {
    return payments.filter((p) => p.bill_id === billId).reduce((sum, p) => sum + Number(p.amount), 0);
  }

  function remainingDue(bill: Bill): number {
    return Math.max(0, Math.round((Number(bill.total_amount) - amountPaidForBill(bill.id)) * 100) / 100);
  }

  function generateUpiUri(bill: Bill): string {
    const upiId = settings?.upi_id ?? 'society@upi';
    const payeeName = settings?.payee_name ?? 'Society';
    const unit = unitsMap[bill.unit_id];
    const note = `Maintenance ${unit?.unit_number ?? ''} ${monthLabel(bill.period_month, bill.period_year)}`;
    const amountDue = remainingDue(bill);
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountDue}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  // QR code using a public QR API (goqr.me)
  function qrUrl(data: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data)}`;
  }

  async function recordPayment() {
    const amount = Number(recAmount);
    if (!recUnitId || !amount || amount <= 0) {
      setError('Please select a unit and enter a valid amount.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const data = await dataApi.createPayment({
        bill_id: recBillId || null,
        unit_id: recUnitId,
        amount,
        method: recMethod,
        reference_no: recRef || null,
      });

      setPayments([data, ...payments]);

      // Server updates bill status; mirror locally for immediate UI feedback
      if (recBillId) {
        const bill = bills.find((b) => b.id === recBillId);
        if (bill) {
          const priorPaid = payments
            .filter((p) => p.bill_id === recBillId)
            .reduce((sum, p) => sum + Number(p.amount), 0);
          const totalPaid = priorPaid + amount;
          const newStatus: BillStatus = totalPaid >= Number(bill.total_amount) ? 'paid' : 'partial';
          setBills(bills.map((b) => (b.id === recBillId ? { ...b, status: newStatus } : b)));
        }
      }

      setShowRecord(false);
      setRecUnitId('');
      setRecBillId('');
      setRecAmount('');
      setRecRef('');
    } catch {
      setError('Could not record the payment. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function downloadReceipt(payment: Payment) {
    const unit = unitsMap[payment.unit_id];
    const bill = payment.bill_id ? bills.find((b) => b.id === payment.bill_id) : null;
    const societyName = settings?.name ?? 'Society';
    const content = `${societyName.toUpperCase()}\nPAYMENT RECEIPT\n\nReceipt No: ${payment.id.slice(0, 8).toUpperCase()}\nDate: ${formatDateTime(payment.paid_at)}\n\nUnit: ${unit?.unit_number}\nOwner: ${unit?.owner_name}\n${bill ? `Bill Period: ${monthLabel(bill.period_month, bill.period_year)}\n` : ''}\nAmount: ${formatCurrency(Number(payment.amount))}\nMethod: ${payment.method.toUpperCase()}\nReference: ${payment.reference_no ?? '—'}\n\nStatus: PAID\n\nThank you for your payment.\n${societyName}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${unit?.unit_number}-${payment.id.slice(0, 6)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading payments...</div>;

  const myBills = bills.filter((b) => b.unit_id === currentUnit?.id);
  const unpaidBills = myBills.filter((b) => b.status === 'pending' || b.status === 'overdue' || b.status === 'partial');
  const myPayments = payments.filter((p) => p.unit_id === currentUnit?.id);
  const displayPayments = role === 'resident' ? myPayments : payments;

  const filteredPayments = displayPayments.filter((p) => {
    if (!search) return true;
    const unit = unitsMap[p.unit_id];
    return unit?.unit_number.toLowerCase().includes(search.toLowerCase()) || unit?.owner_name.toLowerCase().includes(search.toLowerCase()) || (p.reference_no ?? '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">{role === 'resident' ? 'Pay your maintenance & view receipts' : 'Payment collection & transaction history'}</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => { setError(''); setShowRecord(true); }}>
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        )}
      </div>

      {error && !showRecord && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {role === 'resident' && unpaidBills.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-900 mb-3">Pending Payments</h3>
          <div className="space-y-3">
            {unpaidBills.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3">
                <div>
                  <p className="font-medium text-slate-800">{monthLabel(b.period_month, b.period_year)}</p>
                  <p className="text-sm text-slate-500">
                    {formatCurrency(remainingDue(b))} due &middot; Due {formatDate(b.due_date)}
                    {b.status === 'overdue' && <span className="text-rose-600 font-medium"> &middot; Overdue</span>}
                    {b.status === 'partial' && <span className="text-amber-600 font-medium"> &middot; Partially paid</span>}
                  </p>
                </div>
                <Button size="sm" onClick={() => { setQrBill(b); setShowPay(true); }}>
                  <QrCode className="h-4 w-4" /> Pay via UPI
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {role === 'admin' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by unit, owner, or reference..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Transaction History</h3>
        </div>
        {filteredPayments.length === 0 ? (
          <EmptyState icon={<Wallet className="h-8 w-8" />} title="No payments yet" message="Payments will appear here once recorded." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  {role === 'admin' && <th className="px-4 py-3 font-medium">Unit</th>}
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const unit = unitsMap[p.unit_id];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      {role === 'admin' && (
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{unit?.unit_number ?? '—'}</p>
                          <p className="text-xs text-slate-400">{unit?.owner_name}</p>
                        </td>
                      )}
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(Number(p.amount))}</td>
                      <td className="px-4 py-3"><Badge color="teal">{p.method.toUpperCase()}</Badge></td>
                      <td className="px-4 py-3 text-slate-500">{p.reference_no ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(p.paid_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => downloadReceipt(p)} className="text-slate-400 hover:text-teal-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pay via UPI QR Modal */}
      <Modal open={showPay} onClose={() => setShowPay(false)} title="Pay via UPI QR Code">
        {qrBill && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <img src={qrUrl(generateUpiUri(qrBill))} alt="UPI QR Code" className="h-60 w-60" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{formatCurrency(remainingDue(qrBill))}</p>
              <p className="text-sm text-slate-500">{monthLabel(qrBill.period_month, qrBill.period_year)}</p>
              <p className="text-sm text-slate-400 mt-1">UPI ID: {settings?.upi_id}</p>
            </div>
            <div className="w-full rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-sm text-slate-600">
                Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm) to pay.
                After paying, your receipt will be generated automatically once the admin records the payment.
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPay(false)}>Close</Button>
              <Button className="flex-1" onClick={() => { setShowPay(false); onNavigate('billing'); }}>
                <CheckCircle2 className="h-4 w-4" /> I've Paid
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal (admin) */}
      <Modal open={showRecord} onClose={() => { setShowRecord(false); setError(''); }} title="Record Payment">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Select
            label="Unit"
            value={recUnitId}
            onChange={(v) => {
              setRecUnitId(v);
              const unitBills = bills.filter(
                (b) => b.unit_id === v && (b.status === 'pending' || b.status === 'overdue' || b.status === 'partial'),
              );
              setRecBillId(unitBills[0]?.id ?? '');
              setRecAmount(unitBills[0] ? String(remainingDue(unitBills[0])) : '');
            }}
            options={[{ value: '', label: 'Select unit...' }, ...units.map((u) => ({ value: u.id, label: `${u.unit_number} - ${u.owner_name}` }))]}
          />
          <Select
            label="Bill (optional)"
            value={recBillId}
            onChange={(v) => {
              setRecBillId(v);
              const bill = bills.find((b) => b.id === v);
              if (bill) setRecAmount(String(remainingDue(bill)));
            }}
            options={[
              { value: '', label: 'Ad-hoc / advance payment' },
              ...bills
                .filter((b) => b.unit_id === recUnitId && (b.status === 'pending' || b.status === 'overdue' || b.status === 'partial'))
                .map((b) => ({
                  value: b.id,
                  label: `${monthLabel(b.period_month, b.period_year)} - ${formatCurrency(remainingDue(b))} due${b.status === 'partial' ? ' (partial)' : ''}`,
                })),
            ]}
          />
          <Input label="Amount (INR)" type="number" value={recAmount} onChange={setRecAmount} placeholder="0" />
          <Select
            label="Payment Method"
            value={recMethod}
            onChange={(v) => setRecMethod(v as PaymentMethod)}
            options={[
              { value: 'upi', label: 'UPI' },
              { value: 'cash', label: 'Cash' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'cheque', label: 'Cheque' },
            ]}
          />
          <Input label="Reference Number (optional)" value={recRef} onChange={setRecRef} placeholder="UTR / Cheque no" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowRecord(false); setError(''); }}>Cancel</Button>
            <Button onClick={recordPayment} disabled={saving || !recUnitId || !recAmount}>
              {saving ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
