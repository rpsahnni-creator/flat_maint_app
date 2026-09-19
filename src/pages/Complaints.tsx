import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Textarea, Select, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { Complaint, Unit } from '@/types';
import { MessageSquare, Plus, Check, Clock, Search, AlertCircle } from 'lucide-react';

export function Complaints() {
  const { role, currentUnit } = useApp();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const [category, setCategory] = useState<Complaint['category']>('plumbing');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [unitsData, data] = await Promise.all([
          dataApi.listUnits(),
          dataApi.listComplaints(),
        ]);
        const map: Record<string, Unit> = {};
        unitsData.forEach((u) => { map[u.id] = u; });
        setUnitsMap(map);
        setComplaints(
          [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        );
      } catch {
        setError('Could not load complaints. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addComplaint() {
    if (!description.trim()) return;
    const unitId = currentUnit?.id;
    if (!unitId) {
      setError('No unit selected. Please select a unit first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await dataApi.createComplaint({
        unit_id: unitId,
        category,
        description: description.trim(),
        status: 'open',
      });
      setComplaints([data, ...complaints]);
      setShowAdd(false);
      setDescription('');
    } catch {
      setError('Could not submit your complaint. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: Complaint['status']) {
    const updates: Record<string, unknown> = { status };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
    try {
      await dataApi.updateComplaint(id, updates);
      setComplaints(complaints.map((c) => (c.id === id ? { ...c, ...updates } as Complaint : c)));
    } catch {
      setError('Could not update the complaint. Please try again.');
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  const statusColor = (s: Complaint['status']) =>
    s === 'open' ? 'amber' : s === 'in_progress' ? 'blue' : 'green';

  const myComplaints = complaints.filter((c) => c.unit_id === currentUnit?.id);
  const baseList = role === 'resident' ? myComplaints : complaints;

  const filtered = baseList.filter((c) => {
    const unit = unitsMap[c.unit_id];
    const matchesSearch =
      !search ||
      unit?.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      unit?.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
          <p className="text-slate-500 mt-1">
            {role === 'resident' ? 'Register & track your complaints' : 'Register & track maintenance complaints'}
          </p>
        </div>
        <Button onClick={() => { setError(''); setShowAdd(true); }}>
          <Plus className="h-4 w-4" /> New Complaint
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {role === 'admin' && (
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-full flex-1 sm:min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search unit, owner, or description..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title="No complaints"
            message={complaints.length === 0 ? 'Register a complaint to get started.' : 'No complaints match your search.'}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const unit = unitsMap[c.unit_id];
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color="slate">{c.category}</Badge>
                      <Badge color={statusColor(c.status)}>{c.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{c.description}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {role === 'admin' && <>{unit?.unit_number ?? '—'} &middot; </>}
                      {formatDateTime(c.created_at)}
                      {c.resolved_at && <> &middot; Resolved {formatDateTime(c.resolved_at)}</>}
                    </p>
                  </div>
                  {role === 'admin' && c.status !== 'resolved' && (
                    <div className="flex flex-col gap-2">
                      {c.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, 'in_progress')}>
                          <Clock className="h-3.5 w-3.5" /> Start
                        </Button>
                      )}
                      <Button size="sm" variant="primary" onClick={() => updateStatus(c.id, 'resolved')}>
                        <Check className="h-3.5 w-3.5" /> Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError(''); }} title="Register Complaint">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Select
            label="Category"
            value={category}
            onChange={(v) => setCategory(v as Complaint['category'])}
            options={[
              { value: 'plumbing', label: 'Plumbing' },
              { value: 'electrical', label: 'Electrical' },
              { value: 'cleaning', label: 'Cleaning' },
              { value: 'security', label: 'Security' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Textarea label="Description" value={description} onChange={setDescription} placeholder="Describe the issue in detail..." rows={4} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setError(''); }}>Cancel</Button>
            <Button onClick={addComplaint} disabled={saving || !description.trim()}>
              {saving ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
