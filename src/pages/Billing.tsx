import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Input, Select, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate, monthLabel, monthNames } from '@/lib/utils';
import type { Bill, Unit, BillStatus } from '@/types';
import { Receipt, Plus, Download, Search, AlertCircle } from 'lucide-react';

export function Billing() {
  const { role, currentUnit, units, settings } = useApp();
  const [bills, setBills] = useState<Bill[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const now = new Date();
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [unitsData, billsData] = await Promise.all([
          dataApi.listUnits(true),
          dataApi.listBills(),
        ]);
        const map: Record<string, Unit> = {};
        unitsData.forEach((u) => { map[u.id] = u; });
        setUnitsMap(map);
        setBills(
          [...billsData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        );
      } catch {
        setError('Could not load bills. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function generateBills() {
    setGenerating(true);
    setError('');
    setInfo('');
    try {
      const data = await dataApi.generateBills(genMonth, genYear);
      if (!data || data.length === 0) {
        setInfo(`Bills for ${monthLabel(genMonth, genYear)} have already been generated for every active unit.`);
        return;
      }
      setBills([...data, ...bills]);
      setShowGenerate(false);
    } catch {
      setError('Could not generate bills. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function downloadBill(bill: Bill) {
    const unit = unitsMap[bill.unit_id];
    const content = `${(settings?.name ?? 'SOCIETY').toUpperCase()}\nMAINTENANCE BILL\n\nUnit: ${unit?.unit_number}\nOwner: ${unit?.owner_name}\nPeriod: ${monthLabel(bill.period_month, bill.period_year)}\nDue Date: ${formatDate(bill.due_date)}\n\nBase Amount: ${formatCurrency(Number(bill.base_amount))}\nLate Fee: ${formatCurrency(Number(bill.late_fee))}\nTotal: ${formatCurrency(Number(bill.total_amount))}\nStatus: ${bill.status.toUpperCase()}\n\nUPI ID: ${settings?.upi_id}\nPayee: ${settings?.payee_name}\nBank: ${settings?.bank_name}\nA/C: ${settings?.account_number}\nIFSC: ${settings?.ifsc}\n\nThank you for your payment.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${unit?.unit_number}-${bill.period_month}-${bill.period_year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const myBills = bills.filter((b) => b.unit_id === currentUnit?.id);
  const displayBills = role === 'resident' ? myBills : bills;

  const filtered = displayBills.filter((b) => {
    const unit = unitsMap[b.unit_id];
    const matchesSearch = !search || unit?.unit_number.toLowerCase().includes(search.toLowerCase()) || unit?.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColor = (s: BillStatus) =>
    s === 'paid' ? 'green' : s === 'overdue' ? 'red' : s === 'partial' ? 'amber' : 'amber';

  if (loading) return <div className="py-20 text-center text-slate-400">Loading bills...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Bills</h1>
          <p className="text-slate-500 mt-1">{role === 'resident' ? 'Your billing history' : 'Monthly billing & per-unit status'}</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => { setError(''); setInfo(''); setShowGenerate(true); }}>
            <Plus className="h-4 w-4" /> Generate Bills
          </Button>
        )}
      </div>

      {role === 'admin' && (
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-full flex-1 sm:min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search unit or owner..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'overdue', label: 'Overdue' },
            ]}
          />
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={<Receipt className="h-8 w-8" />} title="No bills found" message="Bills will appear here once generated." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  {role === 'admin' && <th className="px-4 py-3 font-medium">Unit</th>}
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Base</th>
                  <th className="px-4 py-3 font-medium">Late Fee</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const unit = unitsMap[b.unit_id];
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      {role === 'admin' && (
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{unit?.unit_number ?? '—'}</p>
                          <p className="text-xs text-slate-400">{unit?.owner_name}</p>
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-600">{monthLabel(b.period_month, b.period_year)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(b.base_amount))}</td>
                      <td className="px-4 py-3 text-slate-600">{Number(b.late_fee) > 0 ? formatCurrency(Number(b.late_fee)) : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(Number(b.total_amount))}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(b.due_date)}</td>
                      <td className="px-4 py-3"><Badge color={statusColor(b.status)}>{b.status}</Badge></td>
                      <td className="px-4 py-3">
                        <button onClick={() => downloadBill(b)} className="text-slate-400 hover:text-teal-600">
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

      <Modal open={showGenerate} onClose={() => { setShowGenerate(false); setError(''); setInfo(''); }} title="Generate Monthly Bills">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {info && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {info}
            </div>
          )}
          <p className="text-sm text-slate-500">
            This will create maintenance bills for all {units.length} active units that don't already have a bill for the selected period.
            Rate: {formatCurrency(settings?.monthly_rate_per_sqft ?? 3)}/sqft
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Month"
              value={String(genMonth)}
              onChange={(v) => { setGenMonth(Number(v)); setInfo(''); }}
              options={monthNames.map((m, i) => ({ value: String(i + 1), label: m }))}
            />
            <Input label="Year" type="number" value={genYear} onChange={(v) => { setGenYear(Number(v)); setInfo(''); }} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowGenerate(false); setError(''); setInfo(''); }}>Cancel</Button>
            <Button onClick={generateBills} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Bills'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
