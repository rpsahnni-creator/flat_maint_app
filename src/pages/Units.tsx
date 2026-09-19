import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Input, EmptyState, StatCard } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Unit, Bill } from '@/types';
import { Users, Plus, Search, Edit3, Building, AlertCircle } from 'lucide-react';

export function Units() {
  const { units, settings, refreshUnits } = useApp();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [error, setError] = useState('');

  const [unitNumber, setUnitNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [floor, setFloor] = useState('1');
  const [area, setArea] = useState('1000');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await dataApi.listBills();
        setBills(data);
      } catch {
        setError('Could not load unit billing status.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  function getUnitStatus(unitId: string): { status: string; amount: number } {
    const bill = bills.find((b) => b.unit_id === unitId && b.period_month === currentMonth && b.period_year === currentYear);
    if (!bill) return { status: 'no_bill', amount: 0 };
    return { status: bill.status, amount: Number(bill.total_amount) };
  }

  const filtered = units.filter((u) =>
    !search || u.unit_number.toLowerCase().includes(search.toLowerCase()) || u.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  async function saveUnit() {
    if (!ownerName.trim() || (!editUnit && !unitNumber.trim())) {
      setError('Please fill in the required fields.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (editUnit) {
        await dataApi.updateUnit(editUnit.id, {
          owner_name: ownerName.trim(),
          phone: phone.trim() || null,
          floor: Number(floor),
          area_sqft: Number(area),
        });
      } else {
        await dataApi.createUnit({
          unit_number: unitNumber.trim(),
          owner_name: ownerName.trim(),
          phone: phone.trim() || null,
          floor: Number(floor),
          area_sqft: Number(area),
        });
      }

      await refreshUnits();
      setShowAdd(false);
      setEditUnit(null);
      setUnitNumber('');
      setOwnerName('');
      setPhone('');
      setFloor('1');
      setArea('1000');
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err ?? '');
      if (!editUnit && /already|unique|duplicate|23505/i.test(msg)) {
        setError('A unit with this number already exists.');
      } else {
        setError(editUnit ? 'Could not update the unit. Please try again.' : 'Could not add the unit. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  const totalUnits = units.length;
  const paidCount = units.filter((u) => getUnitStatus(u.id).status === 'paid').length;
  const pendingCount = units.filter((u) => getUnitStatus(u.id).status === 'pending' || getUnitStatus(u.id).status === 'overdue').length;
  const overdueCount = units.filter((u) => getUnitStatus(u.id).status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Units Management</h1>
          <p className="text-slate-500 mt-1">{totalUnits} units &middot; Track per-unit maintenance status</p>
        </div>
        <Button onClick={() => { setEditUnit(null); setError(''); setShowAdd(true); }}>
          <Plus className="h-4 w-4" /> Add Unit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Units" value={totalUnits} icon={<Building className="h-6 w-6" />} accent="slate" />
        <StatCard label="Paid" value={paidCount} icon={<Users className="h-6 w-6" />} accent="teal" />
        <StatCard label="Pending" value={pendingCount} icon={<Users className="h-6 w-6" />} accent="amber" />
        <StatCard label="Overdue" value={overdueCount} icon={<Users className="h-6 w-6" />} accent="rose" />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search unit or owner..."
          className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" />} title="No units found" />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Floor</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Monthly Bill</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const s = getUnitStatus(u.id);
                  const monthlyBill = Math.round(u.area_sqft * (settings?.monthly_rate_per_sqft ?? 3));
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{u.unit_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{u.owner_name}</p>
                        <p className="text-xs text-slate-400">{u.phone ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.floor}</td>
                      <td className="px-4 py-3 text-slate-600">{u.area_sqft} sqft</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(monthlyBill)}</td>
                      <td className="px-4 py-3">
                        {s.status === 'paid' && <Badge color="green">Paid</Badge>}
                        {s.status === 'pending' && <Badge color="amber">Pending</Badge>}
                        {s.status === 'overdue' && <Badge color="red">Overdue</Badge>}
                        {s.status === 'no_bill' && <Badge color="slate">No Bill</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setEditUnit(u);
                            setOwnerName(u.owner_name);
                            setPhone(u.phone ?? '');
                            setFloor(String(u.floor));
                            setArea(String(u.area_sqft));
                            setError('');
                            setShowAdd(true);
                          }}
                          className="text-slate-400 hover:text-teal-600"
                        >
                          <Edit3 className="h-4 w-4" />
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

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditUnit(null); setError(''); }} title={editUnit ? 'Edit Unit' : 'Add Unit'}>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {!editUnit && <Input label="Unit Number" value={unitNumber} onChange={setUnitNumber} placeholder="A-061" required />}
          <Input label="Owner Name" value={ownerName} onChange={setOwnerName} placeholder="Owner name" required />
          <Input label="Phone" value={phone} onChange={setPhone} placeholder="+91..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Floor" type="number" value={floor} onChange={setFloor} />
            <Input label="Area (sqft)" type="number" value={area} onChange={setArea} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditUnit(null); setError(''); }}>Cancel</Button>
            <Button onClick={saveUnit} disabled={saving}>
              {saving ? 'Saving...' : editUnit ? 'Update Unit' : 'Add Unit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
