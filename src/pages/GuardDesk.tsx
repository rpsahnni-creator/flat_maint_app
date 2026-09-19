import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, StatCard, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { SosAlert, Unit, Visitor } from '@/types';
import {
  Shield,
  Users,
  Siren,
  LogIn,
  LogOut,
  Check,
  Phone,
  AlertCircle,
  Bell,
  MessageCircle,
} from 'lucide-react';

export function GuardDesk({
  onNavigate,
  onChat,
}: {
  onNavigate: (p: string) => void;
  onChat?: (unitId: string) => void;
}) {
  const { units } = useApp();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [unitsData, visitorData, sosData] = await Promise.all([
        dataApi.listUnits(true),
        dataApi.listVisitors(),
        dataApi.listSosAlerts(),
      ]);
      const map: Record<string, Unit> = {};
      unitsData.forEach((u) => {
        map[u.id] = u;
      });
      setUnitsMap(map);
      setVisitors(
        [...visitorData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      );
      setAlerts(sosData.filter((a) => a.status === 'active'));
    } catch {
      setError('Could not load gate desk data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateVisitor(id: string, status: Visitor['status']) {
    setError('');
    const updates: Record<string, unknown> = { status };
    if (status === 'checked_in') updates.entry_time = new Date().toISOString();
    if (status === 'checked_out') updates.exit_time = new Date().toISOString();
    try {
      await dataApi.updateVisitor(id, updates);
      setVisitors((prev) => prev.map((v) => (v.id === id ? ({ ...v, ...updates } as Visitor) : v)));
    } catch {
      setError('Could not update visitor status.');
    }
  }

  async function resolveSos(id: string) {
    try {
      await dataApi.updateSos(id, { status: 'resolved', resolved_at: new Date().toISOString() });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Could not resolve SOS alert.');
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading gate desk...</div>;

  const pending = visitors.filter((v) => v.status === 'pending' || v.status === 'approved');
  const inside = visitors.filter((v) => v.status === 'checked_in');
  const recent = visitors.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gate Desk</h1>
          <p className="mt-1 text-slate-500">Visitors, flat owners &amp; emergency alerts — linked to every unit</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('visitors')}>
            <Shield className="h-4 w-4" /> Log Visitor
          </Button>
          <Button variant="outline" onClick={() => onNavigate('directory')}>
            <Phone className="h-4 w-4" /> Call / Chat Owner
          </Button>
          <Button variant="outline" onClick={() => onNavigate('chat')}>
            <MessageCircle className="h-4 w-4" /> Messages
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Flats / Owners" value={String(units.length)} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Waiting at Gate" value={String(pending.length)} icon={<Bell className="h-5 w-5" />} />
        <StatCard label="Currently Inside" value={String(inside.length)} icon={<LogIn className="h-5 w-5" />} />
        <StatCard label="Active SOS" value={String(alerts.length)} icon={<Siren className="h-5 w-5" />} />
      </div>

      {alerts.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/60">
          <div className="mb-3 flex items-center gap-2">
            <Siren className="h-5 w-5 text-rose-600" />
            <h2 className="font-semibold text-rose-900">Active Emergency Alerts</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((a) => {
              const unit = unitsMap[a.unit_id];
              return (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {unit?.unit_number ?? 'Unit'} — {unit?.owner_name ?? 'Owner'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {a.alert_type}: {a.message || 'No details'} · {formatDateTime(a.created_at)}
                    </p>
                    {unit?.phone && (
                      <a href={`tel:${unit.phone}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#9f1239]">
                        <Phone className="h-3.5 w-3.5" /> {unit.phone}
                      </a>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => resolveSos(a.id)}>
                    <Check className="h-3.5 w-3.5" /> Mark Resolved
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Waiting / Approved</h2>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('visitors')}>View all</Button>
          </div>
          {pending.length === 0 ? (
            <EmptyState icon={<Shield className="h-8 w-8" />} title="Gate clear" message="No visitors waiting right now." />
          ) : (
            <div className="space-y-3">
              {pending.map((v) => {
                const unit = v.host_unit_id ? unitsMap[v.host_unit_id] : null;
                return (
                  <div key={v.id} className="rounded-xl border border-slate-200 px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{v.visitor_name}</p>
                          <Badge color={v.status === 'pending' ? 'amber' : 'blue'}>{v.status}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          Host: {unit ? `${unit.unit_number} · ${unit.owner_name}` : '—'}
                        </p>
                        {unit?.phone && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            <a href={`tel:${unit.phone}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#9f1239]">
                              <Phone className="h-3 w-3" /> Call {unit.phone}
                            </a>
                            {onChat && (
                              <button
                                type="button"
                                onClick={() => onChat(unit.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
                              >
                                <MessageCircle className="h-3 w-3" /> Chat owner
                              </button>
                            )}
                          </div>
                        )}
                        {!unit?.phone && onChat && unit && (
                          <button
                            type="button"
                            onClick={() => onChat(unit.id)}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
                          >
                            <MessageCircle className="h-3 w-3" /> Chat owner
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {v.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateVisitor(v.id, 'approved')}>
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => updateVisitor(v.id, 'denied')}>
                            Deny
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => updateVisitor(v.id, 'checked_in')}>
                        <LogIn className="h-3.5 w-3.5" /> Check In
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Inside Society</h2>
          </div>
          {inside.length === 0 ? (
            <EmptyState icon={<LogOut className="h-8 w-8" />} title="No one inside" message="Checked-in visitors will show here." />
          ) : (
            <div className="space-y-3">
              {inside.map((v) => {
                const unit = v.host_unit_id ? unitsMap[v.host_unit_id] : null;
                return (
                  <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{v.visitor_name}</p>
                      <p className="text-sm text-slate-500">
                        {unit ? `${unit.unit_number} · ${unit.owner_name}` : '—'}
                        {v.entry_time ? ` · In ${formatDateTime(v.entry_time)}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => updateVisitor(v.id, 'checked_out')}>
                      <LogOut className="h-3.5 w-3.5" /> Check Out
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No visitor entries yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((v) => {
              const unit = v.host_unit_id ? unitsMap[v.host_unit_id] : null;
              return (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="font-medium text-slate-800">{v.visitor_name}</span>
                  <span className="text-slate-500">{unit?.unit_number ?? '—'} · {unit?.owner_name ?? ''}</span>
                  <Badge color="slate">{v.status.replace('_', ' ')}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
