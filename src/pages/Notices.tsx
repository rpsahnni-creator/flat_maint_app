import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Input, Textarea, Select, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Notice } from '@/types';
import { Building2, Plus, Bell, Trash2, AlertCircle } from 'lucide-react';

export function Notices() {
  const { role } = useApp();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await dataApi.listNotices();
        setNotices(
          [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        );
      } catch {
        setError('Could not load notices. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addNotice() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError('');
    try {
      const data = await dataApi.createNotice({ title: title.trim(), body: body.trim(), priority });
      setNotices([data, ...notices]);
      setShowAdd(false);
      setTitle('');
      setBody('');
      setPriority('normal');
    } catch {
      setError('Could not post the notice. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteNotice(id: string) {
    setError('');
    try {
      await dataApi.deleteNotice(id);
      setNotices(notices.filter((n) => n.id !== id));
    } catch {
      setError('Could not delete the notice. Please try again.');
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Digital Notice Board</h1>
          <p className="text-slate-500 mt-1">Important announcements & alerts</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => { setError(''); setShowAdd(true); }}>
            <Plus className="h-4 w-4" /> Post Notice
          </Button>
        )}
      </div>

      {error && !showAdd && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {notices.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="h-8 w-8" />} title="No notices yet" message="Post a notice to inform residents." />
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id} className={n.priority === 'urgent' ? 'border-rose-200' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-slate-900">{n.title}</h3>
                    {n.priority === 'urgent' && <Badge color="red">Urgent</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-3">{formatDate(n.created_at)}</p>
                </div>
                {role === 'admin' && (
                  <button onClick={() => deleteNotice(n.id)} className="text-slate-300 hover:text-rose-500 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError(''); }} title="Post New Notice">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Input label="Title" value={title} onChange={setTitle} placeholder="Notice title" />
          <Textarea label="Message" value={body} onChange={setBody} placeholder="Write the notice content..." rows={5} />
          <Select
            label="Priority"
            value={priority}
            onChange={(v) => setPriority(v as 'normal' | 'urgent')}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setError(''); }}>Cancel</Button>
            <Button onClick={addNotice} disabled={saving || !title || !body}>
              {saving ? 'Posting...' : 'Post Notice'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
