import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { dataApi } from '@/lib/dataApi';
import { Button, Card, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { ChatMessage, ChatThread, Unit } from '@/types';
import { MessageCircle, Phone, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  /** When set (e.g. from Flat Owners), open this unit's chat immediately */
  initialUnitId?: string | null;
  onClearInitialUnit?: () => void;
};

export function GateChat({ initialUnitId = null, onClearInitialUnit }: Props) {
  const { role, units, currentUnit } = useApp();
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = user ? String(user.id) : '';

  const refreshThreads = useCallback(async () => {
    const list = await dataApi.listChatThreads();
    setThreads(list);
    return list;
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    const msgs = await dataApi.listChatMessages(threadId);
    setMessages(msgs);
    await refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    (async () => {
      try {
        await refreshThreads();
      } catch {
        setError('Could not load chats.');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshThreads]);

  // Open chat for a unit (guard from directory / owner auto)
  useEffect(() => {
    (async () => {
      const unitId = initialUnitId || (role === 'resident' ? currentUnit?.id : null);
      if (!unitId) return;
      try {
        const thread = await dataApi.openChatThread(unitId);
        setActiveId(thread.id);
        setMobileShowThread(true);
        await refreshThreads();
        await loadMessages(thread.id);
        onClearInitialUnit?.();
      } catch {
        setError('Could not open chat with this owner.');
      }
    })();
  }, [initialUnitId, role, currentUnit?.id, refreshThreads, loadMessages, onClearInitialUnit]);

  // Poll active thread
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => {
      void loadMessages(activeId);
    }, 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function selectThread(thread: ChatThread) {
    setActiveId(thread.id);
    setMobileShowThread(true);
    setError('');
    try {
      await loadMessages(thread.id);
    } catch {
      setError('Could not load messages.');
    }
  }

  async function startChatWithUnit(unit: Unit) {
    setError('');
    try {
      const thread = await dataApi.openChatThread(unit.id);
      await refreshThreads();
      await selectThread(thread);
    } catch {
      setError('Could not start chat.');
    }
  }

  async function send() {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    setError('');
    try {
      const msg = await dataApi.sendChatMessage(activeId, draft.trim());
      setMessages((prev) => [...prev, msg]);
      setDraft('');
      await refreshThreads();
    } catch {
      setError('Could not send message.');
    } finally {
      setSending(false);
    }
  }

  const active = threads.find((t) => t.id === activeId) ?? null;
  const unitsWithoutThread =
    role === 'guard' || role === 'admin'
      ? units.filter((u) => !threads.some((t) => t.unit_id === u.id))
      : [];

  if (loading) return <div className="py-20 text-center text-slate-400">Loading chats...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {role === 'guard' ? 'Chat with Flat Owners' : 'Messages with Gate'}
        </h1>
        <p className="mt-1 text-slate-500">
          {role === 'guard'
            ? 'Call or message any flat owner when a guest arrives'
            : 'Chat with the gate guard about visitors and deliveries'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid min-h-[28rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[20rem_1fr]">
        {/* Thread list */}
        <div
          className={cn(
            'border-b border-slate-200 lg:border-b-0 lg:border-r',
            mobileShowThread ? 'hidden lg:flex lg:flex-col' : 'flex flex-col',
          )}
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && unitsWithoutThread.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<MessageCircle className="h-8 w-8" />}
                  title="No chats yet"
                  message={role === 'guard' ? 'Open Flat Owners and tap Chat.' : 'Wait for the gate to message you, or start below.'}
                />
                {role === 'resident' && currentUnit && (
                  <Button className="mt-3 w-full" onClick={() => startChatWithUnit(currentUnit)}>
                    Message Gate Guard
                  </Button>
                )}
              </div>
            ) : (
              <ul>
                {threads.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectThread(t)}
                      className={cn(
                        'flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50',
                        activeId === t.id && 'bg-emerald-50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {t.unit_number} · {t.owner_name}
                        </span>
                        {t.unread_count > 0 && (
                          <span className="rounded-full bg-[#9f1239] px-2 py-0.5 text-[10px] font-bold text-white">
                            {t.unread_count}
                          </span>
                        )}
                      </div>
                      <span className="truncate text-xs text-slate-500">
                        {t.last_message?.body ?? 'No messages yet'}
                      </span>
                    </button>
                  </li>
                ))}
                {unitsWithoutThread.slice(0, 8).map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => startChatWithUnit(u)}
                      className="flex w-full items-center justify-between gap-2 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm text-slate-700">
                        {u.unit_number} · {u.owner_name}
                      </span>
                      <span className="text-xs font-medium text-emerald-700">Start chat</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Messages pane */}
        <div
          className={cn(
            'flex min-h-[24rem] flex-col',
            !mobileShowThread ? 'hidden lg:flex' : 'flex',
          )}
        >
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400">
              Select a flat owner to chat
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                    onClick={() => setMobileShowThread(false)}
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {active.unit_number} — {active.owner_name}
                    </p>
                    <p className="text-xs text-slate-400">Gate ↔ Owner chat</p>
                  </div>
                </div>
                {active.owner_phone && (
                  <a
                    href={`tel:${active.owner_phone}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#9f1239] px-3 py-2 text-sm font-semibold text-white hover:bg-[#881337]"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f3f7f4] px-4 py-4">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-slate-400">Say hello — e.g. “Guest at gate for your flat”</p>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === myId;
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                          mine ? 'bg-[var(--shell-active)] text-white' : 'bg-white text-slate-800 border border-slate-100',
                        )}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {m.sender_role === 'guard' ? 'Gate Guard' : m.sender_name}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-slate-400')}>
                          {formatDateTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2 border-t border-slate-100 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  className="w-full flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 sm:text-sm"
                />
                <Button onClick={() => void send()} disabled={sending || !draft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
