import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Textarea, Select, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { SosAlert, Unit } from '@/types';
import { Siren, Plus, Check, AlertCircle } from 'lucide-react';

export function SOS() {
  const { role, currentUnit, units } = useApp();
  const isGateOps = role === 'admin' || role === 'guard';  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [showSos, setShowSos] = useState(false);
  const [alertType, setAlertType] = useState('medical');
  const [message, setMessage] = useState('');
  const [logUnitId, setLogUnitId] = useState('');
  const [triggered, setTriggered] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [unitsData, data] = await Promise.all([
          dataApi.listUnits(),
          dataApi.listSosAlerts(),
        ]);
        const map: Record<string, Unit> = {};
        unitsData.forEach((u) => { map[u.id] = u; });
        setUnitsMap(map);
        setAlerts(
          [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        );
      } catch {
        setError('Could not load SOS alerts. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function triggerSos() {
    const unitId = isGateOps ? logUnitId : currentUnit?.id;
    if (!unitId) {
      setError('Please select a unit.');
      return;
    }
    setError('');
    try {
      const data = await dataApi.createSos({
        unit_id: unitId,
        alert_type: alertType,
        message: message.trim() || null,
        status: 'active',
      });
      setAlerts([data, ...alerts]);
      setTriggered(true);
      setTimeout(() => setTriggered(false), 3000);
      setShowSos(false);
      setMessage('');
      setLogUnitId('');
    } catch {
      setError('Could not send the alert. Please check your connection and try again.');
    }
  }

  async function resolveAlert(id: string) {
    try {
      const resolvedAt = new Date().toISOString();
      await dataApi.updateSos(id, { status: 'resolved', resolved_at: resolvedAt });
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: 'resolved', resolved_at: resolvedAt } : a)));
    } catch {
      setError('Could not resolve the alert. Please try again.');
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const historyAlerts = role === 'resident' ? alerts.filter((a) => a.unit_id === currentUnit?.id) : alerts;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emergency SOS</h1>
          <p className="text-slate-500 mt-1">Trigger emergency alerts to security & committee</p>
        </div>
        {isGateOps && (
          <Button
            variant="outline"
            onClick={() => { setLogUnitId(''); setError(''); setShowSos(true); }}
          >
            <Plus className="h-4 w-4" /> Log Alert for a Unit
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {role === 'resident' && (
        <Card className="border-rose-200 bg-rose-50">
          <div className="flex flex-col items-center gap-4 py-6">
            <Siren className={`h-16 w-16 text-rose-600 ${triggered ? 'animate-bounce' : ''}`} />
            <p className="text-center text-slate-700">
              Press the button below to immediately alert security guards and committee members.
            </p>
            <Button variant="danger" size="lg" className="px-12" onClick={() => { setError(''); setShowSos(true); }}>
              <Siren className="h-5 w-5" /> Trigger SOS
            </Button>
            {triggered && <p className="text-sm font-medium text-rose-600">Alert sent! Help is on the way.</p>}
          </div>
        </Card>
      )}

      {activeAlerts.length > 0 && (
        <Card className="border-rose-300 bg-rose-50">
          <h3 className="font-semibold text-rose-900 mb-3 flex items-center gap-2">
            <Siren className="h-5 w-5 animate-pulse" /> Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-3">
            {activeAlerts.map((a) => {
              const unit = unitsMap[a.unit_id];
              return (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {unit?.unit_number ?? 'Unknown'} · {unit?.owner_name ?? ''} · {a.alert_type}
                    </p>
                    {a.message && <p className="text-sm text-slate-500">{a.message}</p>}
                    <p className="text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
                    {isGateOps && unit?.phone && (
                      <a href={`tel:${unit.phone}`} className="mt-1 inline-flex text-xs font-medium text-[#9f1239]">
                        Call {unit.phone}
                      </a>
                    )}
                  </div>
                  {isGateOps && (
                    <Button size="sm" variant="primary" onClick={() => resolveAlert(a.id)}>
                      <Check className="h-4 w-4" /> Resolve
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Alert History</h3>
        </div>
        {historyAlerts.length === 0 ? (
          <EmptyState icon={<Siren className="h-8 w-8" />} title="No SOS alerts" message="All clear. No emergencies reported." />
        ) : (
          <div className="divide-y divide-slate-100">
            {historyAlerts.map((a) => {
              const unit = unitsMap[a.unit_id];
              return (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {unit?.unit_number ?? '—'} &middot; {a.alert_type}
                    </p>
                    {a.message && <p className="text-xs text-slate-500">{a.message}</p>}
                    <p className="text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
                  </div>
                  {a.status === 'active' ? <Badge color="red">Active</Badge> : <Badge color="green">Resolved</Badge>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={showSos}
        onClose={() => { setShowSos(false); setError(''); }}
        title={isGateOps ? 'Log Emergency Alert' : 'Trigger Emergency SOS'}
      >
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="rounded-xl bg-rose-50 p-4 text-center">
            <Siren className="mx-auto mb-2 h-10 w-10 text-rose-600" />
            <p className="text-sm text-rose-700">This will immediately notify security and committee members.</p>
          </div>
          {isGateOps && (
            <Select
              label="Unit"
              value={logUnitId}
              onChange={setLogUnitId}
              options={[
                { value: '', label: 'Select unit...' },
                ...units.map((u) => ({ value: u.id, label: `${u.unit_number} — ${u.owner_name}` })),
              ]}
            />
          )}
          <Select
            label="Emergency Type"
            value={alertType}
            onChange={setAlertType}
            options={[
              { value: 'medical', label: 'Medical Emergency' },
              { value: 'fire', label: 'Fire' },
              { value: 'security', label: 'Security Threat' },
              { value: 'general', label: 'Other Emergency' },
            ]}
          />
          <Textarea label="Details (optional)" value={message} onChange={setMessage} placeholder="Describe the emergency..." rows={3} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowSos(false); setError(''); }}>Cancel</Button>
            <Button variant="danger" onClick={triggerSos} disabled={isGateOps && !logUnitId}>
              <Siren className="h-4 w-4" /> {isGateOps ? 'Log Alert' : 'Send SOS Alert'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
