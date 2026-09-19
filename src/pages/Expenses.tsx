import { useEffect, useState } from 'react';
import { dataApi } from '@/lib/dataApi';
import { Card, StatCard, Badge, Button, Modal, Input, Select, Textarea, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate, monthLabel, monthNames } from '@/lib/utils';
import type { Expense, Payment, Bill } from '@/types';
import { TrendingUp, Plus, Trash2, PieChart, AlertCircle } from 'lucide-react';

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  // Add form
  const [cat, setCat] = useState('Electricity');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [expData, payData, billData] = await Promise.all([
          dataApi.listExpenses(),
          dataApi.listPayments(),
          dataApi.listBills(),
        ]);
        setExpenses(
          [...expData].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()),
        );
        setPayments(payData);
        setBills(billData);
      } catch {
        setError('Could not load expenses. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addExpense() {
    const amt = Number(amount);
    if (!cat || !amt || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await dataApi.createExpense({
        category: cat,
        description: desc.trim() || null,
        amount: amt,
        expense_date: date,
      });
      setExpenses([data, ...expenses]);
      setShowAdd(false);
      setDesc('');
      setAmount('');
    } catch {
      setError('Could not add the expense. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id: string) {
    setError('');
    try {
      await dataApi.deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch {
      setError('Could not delete the expense. Please try again.');
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
  });
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const monthPayments = payments.filter((p) => {
    const d = new Date(p.paid_at);
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
  });
  const totalCollected = monthPayments.reduce((s, p) => s + Number(p.amount), 0);

  const monthBills = bills.filter((b) => b.period_month === filterMonth && b.period_year === filterYear);
  const totalBilled = monthBills.reduce((s, b) => s + Number(b.total_amount), 0);

  const netBalance = totalCollected - totalExpenses;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount);
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const categoryColors = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];
  const maxCat = Math.max(...categories.map((c) => c[1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses & Reports</h1>
          <p className="text-slate-500 mt-1">Track expenditure and view collection reports</p>
        </div>
        <Button onClick={() => { setError(''); setShowAdd(true); }}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {error && !showAdd && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Select
          value={String(filterMonth)}
          onChange={(v) => setFilterMonth(Number(v))}
          options={monthNames.map((m, i) => ({ value: String(i + 1), label: m }))}
        />
        <Input type="number" value={filterYear} onChange={(v) => setFilterYear(Number(v))} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Collected" value={formatCurrency(totalCollected)} icon={<TrendingUp className="h-6 w-6" />} accent="teal" />
        <StatCard label="Billed" value={formatCurrency(totalBilled)} icon={<TrendingUp className="h-6 w-6" />} accent="blue" />
        <StatCard label="Expenses" value={formatCurrency(totalExpenses)} icon={<TrendingUp className="h-6 w-6" />} accent="amber" />
        <StatCard label="Net Balance" value={formatCurrency(netBalance)} icon={<TrendingUp className="h-6 w-6" />} accent={netBalance >= 0 ? 'teal' : 'rose'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Expense by Category</h3>
          </div>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No expenses for this period</p>
          ) : (
            <div className="space-y-3">
              {categories.map(([catName, amt], i) => (
                <div key={catName}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-3 w-3 rounded-full" style={{ background: categoryColors[i % categoryColors.length] }} />
                      {catName}
                    </span>
                    <span className="font-medium text-slate-900">{formatCurrency(amt)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(amt / maxCat) * 100}%`, background: categoryColors[i % categoryColors.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Total Units Billed</span>
              <span className="font-medium text-slate-900">{monthBills.length}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Total Collected</span>
              <span className="font-medium text-emerald-600">{formatCurrency(totalCollected)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Pending Collection</span>
              <span className="font-medium text-amber-600">{formatCurrency(totalBilled - totalCollected)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Total Expenses</span>
              <span className="font-medium text-rose-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-medium text-slate-700">Net Balance</span>
              <span className={`font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(netBalance)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Expense Records — {monthLabel(filterMonth, filterYear)}</h3>
        </div>
        {monthExpenses.length === 0 ? (
          <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No expenses" message="Add an expense to get started." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Badge color="slate">{e.category}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{e.description ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(Number(e.amount))}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(e.expense_date)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError(''); }} title="Add Expense">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Select
            label="Category"
            value={cat}
            onChange={setCat}
            options={['Electricity', 'Water', 'Security', 'Cleaning', 'Maintenance', 'Garden', 'Salary', 'Other'].map((c) => ({ value: c, label: c }))}
          />
          <Textarea label="Description" value={desc} onChange={setDesc} placeholder="What was this expense for?" />
          <Input label="Amount (INR)" type="number" value={amount} onChange={setAmount} placeholder="0" />
          <Input label="Date" type="date" value={date} onChange={setDate} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setError(''); }}>Cancel</Button>
            <Button onClick={addExpense} disabled={saving || !amount}>
              {saving ? 'Saving...' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
