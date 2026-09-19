import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, StatCard, Badge, Button } from '@/components/ui';
import { formatCurrency, formatDate, monthLabel, cn } from '@/lib/utils';
import type { Bill, Payment, Expense, Notice, SosAlert } from '@/types';
import { Wallet, AlertTriangle, CheckCircle2, TrendingUp, Building2, Siren, Bell, Receipt } from 'lucide-react';

export function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { role, currentUnit, settings } = useApp();
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    (async () => {
      try {
        const [billsData, paymentsData, expensesData, noticesData, sosData] = await Promise.all([
          dataApi.listBills(),
          dataApi.listPayments(),
          dataApi.listExpenses(),
          dataApi.listNotices(),
          dataApi.listSosAlerts('active'),
        ]);
        setBills(billsData);
        setPayments(
          [...paymentsData]
            .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())
            .slice(0, 10),
        );
        setExpenses(
          [...expensesData]
            .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
            .slice(0, 10),
        );
        setNotices(
          [...noticesData]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5),
        );
        setSosAlerts(
          [...sosData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        );
      } catch {
        /* keep empty state on load failure */
      }
    })();
  }, []);

  if (role === 'resident') {
    return <ResidentDashboard currentUnit={currentUnit} bills={bills} notices={notices} onNavigate={onNavigate} />;
  }

  const currentBills = bills.filter((b) => b.period_month === currentMonth && b.period_year === currentYear);
  const totalBilled = currentBills.reduce((s, b) => s + Number(b.total_amount), 0);
  const totalCollected = currentBills.filter((b) => b.status === 'paid').reduce((s, b) => s + Number(b.total_amount), 0);
  const pendingCount = currentBills.filter((b) => b.status === 'pending' || b.status === 'overdue').length;
  const overdueCount = currentBills.filter((b) => b.status === 'overdue').length;
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">{settings?.name ?? 'Society'} &middot; {monthLabel(currentMonth, currentYear)}</p>
      </div>

      {sosAlerts.length > 0 && (
        <Card className="border-rose-300 bg-rose-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Siren className="h-6 w-6 shrink-0 text-rose-600 animate-pulse" />
              <div className="min-w-0">
                <p className="font-semibold text-rose-900">{sosAlerts.length} Active SOS Alert{sosAlerts.length > 1 ? 's' : ''}</p>
                <p className="text-sm text-rose-700">Immediate attention required. Open SOS to view details.</p>
              </div>
            </div>
            <Button variant="danger" size="sm" className="w-full shrink-0 sm:ml-auto sm:w-auto" onClick={() => onNavigate('sos')}>
              View Alerts
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Billed" value={formatCurrency(totalBilled)} icon={<Receipt className="h-6 w-6" />} accent="teal" />
        <StatCard label="Collected" value={formatCurrency(totalCollected)} icon={<CheckCircle2 className="h-6 w-6" />} accent="blue" sub={`${collectionRate}% collection rate`} />
        <StatCard label="Pending" value={pendingCount} icon={<Wallet className="h-6 w-6" />} accent="amber" sub={`${overdueCount} overdue`} />
        <StatCard label="Expenses" value={formatCurrency(totalExpenses)} icon={<TrendingUp className="h-6 w-6" />} accent="slate" sub="This month" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Collection Progress</h3>
            <Badge color={collectionRate >= 80 ? 'green' : collectionRate >= 50 ? 'amber' : 'red'}>
              {collectionRate}%
            </Badge>
          </div>
          <div className="mb-2 h-4 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                collectionRate >= 80 ? 'bg-emerald-500' : collectionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500',
              )}
              style={{ width: `${collectionRate}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between text-sm text-slate-500">
            <span>Collected: {formatCurrency(totalCollected)}</span>
            <span>Pending: {formatCurrency(totalBilled - totalCollected)}</span>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Bill Status Breakdown</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('billing')}>View All</Button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Paid', count: currentBills.filter((b) => b.status === 'paid').length, color: 'bg-emerald-500' },
              { label: 'Pending', count: currentBills.filter((b) => b.status === 'pending').length, color: 'bg-amber-500' },
              { label: 'Overdue', count: currentBills.filter((b) => b.status === 'overdue').length, color: 'bg-rose-500' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={cn('h-3 w-3 rounded-full', s.color)} />
                <span className="text-sm text-slate-600 flex-1">{s.label}</span>
                <span className="text-sm font-semibold text-slate-900">{s.count} units</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Payments</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('payments')}>View All</Button>
          </div>
          <div className="space-y-2">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{formatCurrency(Number(p.amount))}</p>
                    <p className="text-xs text-slate-400">{p.method.toUpperCase()} &middot; {formatDate(p.paid_at)}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{p.reference_no ?? '—'}</span>
              </div>
            ))}
            {payments.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No payments yet</p>}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Notices</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('notices')}>View All</Button>
          </div>
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-800">{n.title}</span>
                  {n.priority === 'urgent' && <Badge color="red">Urgent</Badge>}
                </div>
                <p className="text-xs text-slate-400">{formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ResidentDashboard({
  currentUnit,
  bills,
  notices,
  onNavigate,
}: {
  currentUnit: { id: string; unit_number: string; owner_name: string } | null;
  bills: Bill[];
  notices: Notice[];
  onNavigate: (p: string) => void;
}) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const myBills = bills.filter((b) => b.unit_id === currentUnit?.id);
  const currentBill = myBills.find((b) => b.period_month === currentMonth && b.period_year === currentYear);
  const overdueBills = myBills.filter((b) => b.status === 'overdue');
  const totalDue = myBills
    .filter((b) => b.status === 'pending' || b.status === 'overdue')
    .reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {currentUnit?.owner_name ?? 'Resident'}</h1>
        <p className="text-slate-500 mt-1">Unit {currentUnit?.unit_number ?? '—'} &middot; {monthLabel(currentMonth, currentYear)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Current Bill"
          value={currentBill ? formatCurrency(Number(currentBill.total_amount)) : '—'}
          icon={<Receipt className="h-6 w-6" />}
          accent="teal"
          sub={currentBill ? `Due ${formatDate(currentBill.due_date)}` : 'No bill yet'}
        />
        <StatCard
          label="Outstanding Dues"
          value={formatCurrency(totalDue)}
          icon={<AlertTriangle className="h-6 w-6" />}
          accent={totalDue > 0 ? 'rose' : 'teal'}
          sub={overdueBills.length > 0 ? `${overdueBills.length} overdue` : 'All clear'}
        />
        <StatCard
          label="Payment Status"
          value={currentBill?.status === 'paid' ? 'Paid' : currentBill?.status === 'overdue' ? 'Overdue' : 'Pending'}
          icon={<CheckCircle2 className="h-6 w-6" />}
          accent={currentBill?.status === 'paid' ? 'teal' : 'amber'}
        />
      </div>

      {currentBill && currentBill.status !== 'paid' && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Maintenance Payment Due</p>
              <p className="text-sm text-amber-700">
                {formatCurrency(Number(currentBill.total_amount))} for {monthLabel(currentBill.period_month, currentBill.period_year)}.
                Due date: {formatDate(currentBill.due_date)}
              </p>
            </div>
            <Button onClick={() => onNavigate('payments')}>Pay Now</Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Notices</h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('notices')}>View All</Button>
        </div>
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-800">{n.title}</span>
                {n.priority === 'urgent' && <Badge color="red">Urgent</Badge>}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{n.body}</p>
              <p className="text-xs text-slate-400 mt-1">{formatDate(n.created_at)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
