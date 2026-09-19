import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, EmptyState } from '@/components/ui';
import { MessageCircle, Phone, Search, Users } from 'lucide-react';

/** Gate guard directory — every flat owner with call + chat */
export function OwnerDirectory({ onChat }: { onChat: (unitId: string) => void }) {
  const { units } = useApp();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...units].sort((a, b) => a.unit_number.localeCompare(b.unit_number));
    return units
      .filter(
        (u) =>
          u.unit_number.toLowerCase().includes(q) ||
          u.owner_name.toLowerCase().includes(q) ||
          (u.phone ?? '').includes(q),
      )
      .sort((a, b) => a.unit_number.localeCompare(b.unit_number));
  }, [units, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Flat Owners Directory</h1>
        <p className="mt-1 text-slate-500">
          Linked to all {units.length} flats — call or chat when a guest arrives at the gate
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search unit, owner, or phone..."
          className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-8 w-8" />} title="No matches" message="Try another unit or owner name." />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <Card key={u.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{u.unit_number}</p>
                  <p className="font-medium text-slate-700">{u.owner_name}</p>
                  <p className="mt-1 text-xs text-slate-400">Floor {u.floor}</p>
                </div>
              </div>
              {u.phone && <p className="mt-3 text-sm text-slate-500">{u.phone}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {u.phone ? (
                  <a
                    href={`tel:${u.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#9f1239] px-3 py-2 text-sm font-semibold text-white hover:bg-[#881337]"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                ) : (
                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-400">No phone</span>
                )}
                <button
                  type="button"
                  onClick={() => onChat(u.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <MessageCircle className="h-4 w-4" /> Chat
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
