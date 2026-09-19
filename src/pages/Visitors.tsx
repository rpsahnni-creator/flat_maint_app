import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Input, Select, Textarea, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { Visitor, Unit, VisitorStatus } from '@/types';
import { Shield, Plus, Check, X, LogIn, LogOut, Search, AlertCircle } from 'lucide-react';

export function Visitors() {
  const { role, currentUnit, units } = useApp();
  const isGateOps = role === 'admin' || role === 'guard';  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hostUnitId, setHostUnitId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [unitsData, data] = await Promise.all([
          dataApi.listUnits(),
          dataApi.listVisitors(),
        ]);
        const map: Record<string, Unit> = {};
        unitsData.forEach((u) => { map[u.id] = u; });
        setUnitsMap(map);
        setVisitors(
          [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        );
      } catch {
        setError('Could not load visitors. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addVisitor() {
    if (!name.trim()) return;
    const hostId = hostUnitId || (role === 'resident' ? currentUnit?.id : null) || null;
    if (isGateOps && !hostId) {
      setError('Please select a host unit.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await dataApi.createVisitor({
        visitor_name: name.trim(),
        purpose: purpose.trim() || null,
        host_unit_id: hostId,
        status: 'pending',
      });
      setVisitors([data, ...visitors]);
      setShowAdd(false);
      setName('');
      setPurpose('');
      setHostUnitId('');
    } catch {
      setError('Could not add the visitor entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: VisitorStatus, extra?: Record<string, string>) {
    setError('');
    const updates: Record<string, unknown> = { status };
    if (status === 'checked_in') updates.entry_time = new Date().toISOString();
    if (status === 'checked_out') updates.exit_time = new Date().toISOString();
    if (extra) Object.assign(updates, extra);
    try {
      await dataApi.updateVisitor(id, updates);
      setVisitors(visitors.map((v) => (v.id === id ? { ...v, ...updates } as Visitor : v)));
    } catch {
      setError('Could not update the visitor entry. Please try again.');
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  const statusColor = (s: VisitorStatus) =>
    s === 'checked_in' ? 'green' : s === 'pending' ? 'amber' : s === 'denied' ? 'red' : s === 'checked_out' ? 'slate' : 'blue';

  const myVisitors = visitors.filter((v) => v.host_unit_id === currentUnit?.id);
  const baseList = role === 'resident' ? myVisitors : visitors;
  const filtered = baseList.filter((v) => {
    if (!search) return true;
    const unit = v.host_unit_id ? unitsMap[v.host_unit_id] : null;
    return (
      v.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
      unit?.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      unit?.owner_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visitor Management</h1>
          <p className="text-slate-500 mt-1">
            {role === 'resident'
              ? 'Guests visiting your unit'
              : role === 'guard'
                ? 'Log arrivals, inform flat owners & manage gate check-in'
                : 'Gate security & visitor approvals'}
          </p>
        </div>
        <Button onClick={() => { setError(''); setShowAdd(true); }}>
          <Plus className="h-4 w-4" /> {role === 'resident' ? 'Pre-approve Guest' : 'Add Visitor'}
        </Button>
      </div>

      {error && !showAdd && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {isGateOps && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor name, unit, or owner..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Shield className="h-8 w-8" />}
            title="No visitors"
            message={visitors.length === 0 ? 'Add a visitor entry to get started.' : 'No visitors match your search.'}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((v) => {
            const unit = v.host_unit_id ? unitsMap[v.host_unit_id] : null;
            return (
              <Card key={v.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{v.visitor_name}</h3>
                      <Badge color={statusColor(v.status)}>{v.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{v.purpose ?? 'No purpose specified'}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isGateOps && <>Host: {unit?.unit_number ?? '—'} {unit?.owner_name ? `· ${unit.owner_name}` : ''} &middot; </>}
                      {formatDateTime(v.created_at)}
                    </p>
                    {isGateOps && unit?.phone && (
                      <a href={`tel:${unit.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#9f1239]">
                        Call owner {unit.phone}
                      </a>
                    )}
                    {v.entry_time && <p className="text-xs text-slate-400">In: {formatDateTime(v.entry_time)}</p>}
                    {v.exit_time && <p className="text-xs text-slate-400">Out: {formatDateTime(v.exit_time)}</p>}
                  </div>
                </div>
                {isGateOps && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {v.status === 'pending' && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => updateStatus(v.id, 'approved')}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => updateStatus(v.id, 'denied')}>
                          <X className="h-3.5 w-3.5" /> Deny
                        </Button>
                      </>
                    )}
                    {(v.status === 'approved' || v.status === 'pending') && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, 'checked_in')}>
                        <LogIn className="h-3.5 w-3.5" /> Check In
                      </Button>
                    )}
                    {v.status === 'checked_in' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, 'checked_out')}>
                        <LogOut className="h-3.5 w-3.5" /> Check Out
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError(''); }} title={role === 'resident' ? 'Pre-approve Guest' : 'Add Visitor'}>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Input label="Visitor Name" value={name} onChange={setName} placeholder="Guest name" />
          <Textarea label="Purpose of Visit" value={purpose} onChange={setPurpose} placeholder="e.g. Delivery, Family visit, Service..." />
          {isGateOps && (
            <Select
              label="Host Unit / Flat Owner"
              value={hostUnitId}
              onChange={setHostUnitId}
              options={[{ value: '', label: 'Select host unit...' }, ...units.map((u) => ({ value: u.id, label: `${u.unit_number} - ${u.owner_name}${u.phone ? ` (${u.phone})` : ''}` }))]}
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setError(''); }}>Cancel</Button>
            <Button onClick={addVisitor} disabled={saving || !name}>
              {saving ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
