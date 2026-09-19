import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { formatCurrency, formatDate, monthLabel, cn } from '@/lib/utils';
import type { Notice, Amenity, Bill, SocietySettings } from '@/types';
import { Send, Bot, User, X, MessageCircle } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function AssistantWidget() {
  const { role, currentUnit, settings } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [kb, setKb] = useState<{
    notices: Notice[];
    amenities: Amenity[];
    bills: Bill[];
    settings: SocietySettings | null;
    unitCount: number;
  }>({ notices: [], amenities: [], bills: [], settings: null, unitCount: 0 });

  useEffect(() => {
    const greeting =
      role === 'admin'
        ? "Hello! Ask me about this month's collection, overdue units, amenities, notices, or society rules."
        : 'Hello! Ask me about maintenance bills, society rules, amenities, notices, or complaints.';
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [role]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [notices, amenities, bills, unitsData] = await Promise.all([
          dataApi.listNotices(),
          dataApi.listAmenities(),
          dataApi.listBills(),
          role === 'admin' ? dataApi.listUnits(true) : Promise.resolve([] as Awaited<ReturnType<typeof dataApi.listUnits>>),
        ]);
        setKb({
          notices: [...notices]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10),
          amenities,
          bills: [...bills]
            .filter((b) => (role === 'admin' ? true : b.unit_id === currentUnit?.id))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
          settings,
          unitCount: unitsData.length,
        });
      } catch {
        /* keep empty knowledge base */
      }
    })();
  }, [open, currentUnit?.id, settings, role]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  function getResponse(query: string): string {
    const q = query.toLowerCase();

    if (role === 'admin' && (q.includes('collect') || q.includes('revenue') || q.includes('income'))) {
      const now = new Date();
      const thisMonthBills = kb.bills.filter((b) => b.period_month === now.getMonth() + 1 && b.period_year === now.getFullYear());
      const collected = thisMonthBills.filter((b) => b.status === 'paid').reduce((s, b) => s + Number(b.total_amount), 0);
      const pending = thisMonthBills.filter((b) => b.status !== 'paid').reduce((s, b) => s + Number(b.total_amount), 0);
      if (thisMonthBills.length === 0) return 'No bills generated for this month yet. Go to Billing to generate them.';
      return `This month: ${formatCurrency(collected)} collected, ${formatCurrency(pending)} pending across ${thisMonthBills.length} bill(s).`;
    }

    if (role === 'admin' && (q.includes('overdue') || q.includes('defaulter'))) {
      const overdue = kb.bills.filter((b) => b.status === 'overdue');
      const total = overdue.reduce((s, b) => s + Number(b.total_amount), 0);
      if (overdue.length === 0) return 'No overdue bills right now.';
      return `${overdue.length} bill(s) overdue, totaling ${formatCurrency(total)}. Check Billing → Overdue.`;
    }

    if (role === 'admin' && (q.includes('how many unit') || q.includes('total unit') || q.includes('occupancy'))) {
      return `The society has ${kb.unitCount} active unit(s).`;
    }

    if (q.includes('bill') || q.includes('maintenance') || q.includes('due') || q.includes('pay')) {
      if (role === 'resident' && (q.includes('how much') || q.includes('my bill') || q.includes('amount') || q.includes('pending') || q.includes('outstanding'))) {
        const myBills = kb.bills.filter((b) => b.status === 'pending' || b.status === 'overdue' || b.status === 'partial');
        const total = myBills.reduce((s, b) => s + Number(b.total_amount), 0);
        if (myBills.length === 0) return 'You have no pending dues. All bills are paid.';
        return `You have ${myBills.length} pending bill(s) totaling ${formatCurrency(total)}. Latest: ${monthLabel(myBills[0].period_month, myBills[0].period_year)} — ${formatCurrency(Number(myBills[0].total_amount))} due ${formatDate(myBills[0].due_date)}.`;
      }
      return `Monthly rate: ${formatCurrency(kb.settings?.monthly_rate_per_sqft ?? 3)}/sqft, due on the ${kb.settings?.due_day_of_month ?? 10}th. Pay from the Payments section.`;
    }

    if (q.includes('gym') || q.includes('fitness')) {
      return 'Gym is open 5:00 AM – 10:00 PM daily, free for residents.';
    }
    if (q.includes('pool') || q.includes('swim')) {
      return 'Pool hours: 6–9 AM and 4–8 PM. ₹50/hour.';
    }
    if (q.includes('clubhouse') || q.includes('party') || q.includes('hall')) {
      return 'Book Clubhouse / Party Hall from Amenities. Party Hall ₹300/hour.';
    }
    if (q.includes('amenit') || q.includes('facilit')) {
      const names = kb.amenities.map((a) => `${a.name} (₹${a.hourly_rate}/hr)`).join(', ');
      return names ? `Amenities: ${names}` : 'No amenities listed yet.';
    }
    if (q.includes('notice') || q.includes('announcement')) {
      if (kb.notices.length === 0) return 'No current notices.';
      const latest = kb.notices[0];
      return `Latest: "${latest.title}" — ${latest.body}`;
    }
    if (q.includes('complain') || q.includes('plumb') || q.includes('repair')) {
      return 'Register complaints from the Complaints section and track status there.';
    }
    if (q.includes('visitor') || q.includes('guest')) {
      return 'Pre-approve guests from Visitors so they are not delayed at the gate.';
    }
    if (q.includes('sos') || q.includes('emergency')) {
      return 'Use the SOS section for emergencies — it alerts security and committee.';
    }
    if (q.includes('upi') || q.includes('bank') || q.includes('ifsc')) {
      return `UPI: ${kb.settings?.upi_id ?? 'society@upi'}\nPayee: ${kb.settings?.payee_name}\nBank: ${kb.settings?.bank_name}\nA/C: ${kb.settings?.account_number}\nIFSC: ${kb.settings?.ifsc}`;
    }
    if (q.includes('rule') || q.includes('guideline')) {
      return `Rules:\n1. Dues by the ${kb.settings?.due_day_of_month ?? 10}th (late fee ₹${kb.settings?.late_fee_per_day ?? 5}/day).\n2. Register visitors at the gate.\n3. Book amenities in advance.\n4. Keep common areas clean.\n5. SOS for emergencies only.`;
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste')) {
      return 'Hi! Ask about bills, amenities, notices, complaints, or rules.';
    }
    if (q.includes('thank')) return "You're welcome!";

    return 'Try: "What is my maintenance bill?", "Gym timings", "Society rules", or "Overdue units" (admin).';
  }

  function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    setMessages((prev) => [...prev, { role: 'user', content: value }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: getResponse(value) }]);
      setThinking(false);
    }, 500);
  }

  const suggestions =
    role === 'admin'
      ? ['Collected this month?', 'Overdue units?', 'Society rules']
      : ['My maintenance bill?', 'Gym timings?', 'How do I pay?'];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 pb-safe sm:bottom-5 sm:right-5">
      {open && (
        <div
          className={cn(
            'flex flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl',
            /* Mobile: near full-screen sheet */
            'fixed inset-x-0 bottom-0 top-12 rounded-t-2xl sm:static sm:inset-auto sm:h-[min(70vh,520px)] sm:w-[min(100vw-1.5rem,380px)] sm:rounded-2xl',
          )}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">AI Assistant</p>
                <p className="text-[11px] text-teal-100">Usually replies instantly</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    m.role === 'assistant' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600',
                  )}
                >
                  {m.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-3 py-2 text-sm',
                    m.role === 'assistant' ? 'bg-white text-slate-800 shadow-sm' : 'bg-teal-600 text-white',
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:border-teal-300 hover:bg-teal-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || thinking}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white',
                  'hover:bg-teal-700 disabled:opacity-40',
                )}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition sm:h-14 sm:w-14',
          'bg-teal-600 text-white hover:bg-teal-700 hover:scale-105 active:scale-95',
          open && 'hidden sm:flex sm:bg-slate-700 sm:hover:bg-slate-800',
        )}
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
