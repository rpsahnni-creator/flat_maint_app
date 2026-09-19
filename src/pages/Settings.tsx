import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Button, Input } from '@/components/ui';
import { Building2, CreditCard, Percent, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export function Settings() {
  const { settings, setSettings } = useApp();

  const [form, setForm] = useState({
    name: settings?.name ?? 'Navya Naman Vatika',
    upi_id: settings?.upi_id ?? 'navyanaman@upi',
    payee_name: settings?.payee_name ?? 'Navya Naman Vatika',
    bank_name: settings?.bank_name ?? 'State Bank of India',
    account_number: settings?.account_number ?? '',
    ifsc: settings?.ifsc ?? '',
    monthly_rate_per_sqft: String(settings?.monthly_rate_per_sqft ?? 3),
    late_fee_per_day: String(settings?.late_fee_per_day ?? 5),
    due_day_of_month: String(settings?.due_day_of_month ?? 10),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    if (!form.name.trim() || !form.upi_id.trim()) {
      setError('Society name and UPI ID are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      upi_id: form.upi_id.trim(),
      payee_name: form.payee_name.trim() || form.name.trim(),
      bank_name: form.bank_name.trim(),
      account_number: form.account_number.trim(),
      ifsc: form.ifsc.trim(),
      monthly_rate_per_sqft: Number(form.monthly_rate_per_sqft) || 0,
      late_fee_per_day: Number(form.late_fee_per_day) || 0,
      due_day_of_month: Math.min(28, Math.max(1, Number(form.due_day_of_month) || 10)),
    };

    try {
      const data = await dataApi.saveSettings(payload);
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Could not save settings. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Society Settings</h1>
        <p className="text-slate-500 mt-1">Configure your society's details, payment info & billing rules</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Society Details</h3>
        </div>
        <Input label="Society Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Navya Naman Vatika" required />
        <p className="mt-2 text-xs text-slate-400">This appears on bills, receipts and throughout the app.</p>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Payment Details</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="UPI ID" value={form.upi_id} onChange={(v) => set('upi_id', v)} placeholder="society@upi" required />
          <Input label="Payee Name" value={form.payee_name} onChange={(v) => set('payee_name', v)} placeholder="Navya Naman Vatika" />
          <Input label="Bank Name" value={form.bank_name} onChange={(v) => set('bank_name', v)} placeholder="State Bank of India" />
          <Input label="Account Number" value={form.account_number} onChange={(v) => set('account_number', v)} placeholder="0000000000000" />
          <Input label="IFSC Code" value={form.ifsc} onChange={(v) => set('ifsc', v)} placeholder="SBIN0000000" />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Used to generate the UPI QR code residents scan to pay, and shown on downloaded bills/receipts.
        </p>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Billing Rules</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Rate per Sqft (₹)"
            type="number"
            value={form.monthly_rate_per_sqft}
            onChange={(v) => set('monthly_rate_per_sqft', v)}
          />
          <Input
            label="Late Fee / Day (₹)"
            type="number"
            value={form.late_fee_per_day}
            onChange={(v) => set('late_fee_per_day', v)}
          />
          <Input
            label="Due Day of Month"
            type="number"
            value={form.due_day_of_month}
            onChange={(v) => set('due_day_of_month', v)}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Monthly bills are calculated as unit area (sqft) × rate. Bills unpaid past the due day
          automatically accrue the late fee, per day late, next time the app is opened.
        </p>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
