import { useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { Login } from '@/pages/Login';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Billing } from '@/pages/Billing';
import { Payments } from '@/pages/Payments';
import { Expenses } from '@/pages/Expenses';
import { Notices } from '@/pages/Notices';
import { Units } from '@/pages/Units';
import { Visitors } from '@/pages/Visitors';
import { Amenities } from '@/pages/Amenities';
import { SOS } from '@/pages/SOS';
import { Complaints } from '@/pages/Complaints';
import { Settings } from '@/pages/Settings';
import { GuardDesk } from '@/pages/GuardDesk';
import { OwnerDirectory } from '@/pages/OwnerDirectory';
import { GateChat } from '@/pages/GateChat';
import { AssistantWidget } from '@/components/AssistantWidget';
import { BrandFooter } from '@/components/BrandFooter';
import { Button, Input, Modal } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import type { Unit } from '@/types';
import { Building2, Menu, X, LogOut, ChevronDown, UserRound, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

function AppShell() {
  const { role, currentUnit, setCurrentUnit, units, loading } = useApp();
  const { user, signOut } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatUnitId, setChatUnitId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-teal-600" />
          <p className="text-slate-500">Loading your society app...</p>
        </div>
      </div>
    );
  }

  function navigate(p: string) {
    setPage(p as PageId);
    setMobileOpen(false);
  }

  function openOwnerChat(unitId: string) {
    setChatUnitId(unitId);
    setPage('chat');
    setMobileOpen(false);
  }

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return role === 'guard' ? <GuardDesk onNavigate={navigate} onChat={openOwnerChat} /> : <Dashboard onNavigate={navigate} />;
      case 'directory':
        return role === 'guard' ? <OwnerDirectory onChat={openOwnerChat} /> : <Dashboard onNavigate={navigate} />;
      case 'chat':
        return (
          <GateChat
            initialUnitId={chatUnitId}
            onClearInitialUnit={() => setChatUnitId(null)}
          />
        );
      case 'billing': return <Billing />;
      case 'payments': return <Payments onNavigate={navigate} />;
      case 'expenses': return <Expenses />;
      case 'notices': return <Notices />;
      case 'units': return <Units />;
      case 'visitors': return <Visitors />;
      case 'amenities': return <Amenities />;
      case 'sos': return <SOS />;
      case 'complaints': return <Complaints />;
      case 'settings': return role === 'admin' ? <Settings /> : <Dashboard onNavigate={navigate} />;
      default: return role === 'guard' ? <GuardDesk onNavigate={navigate} onChat={openOwnerChat} /> : <Dashboard onNavigate={navigate} />;
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f7f4]">
      {/* Desktop sidebar — nav only */}
      <aside className="shell-sidebar fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-[var(--shell-line)] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-[var(--shell-line)] px-6 py-5">
          <div className="shell-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight text-[var(--shell-mist)]">{BRAND.clientName}</p>
            <p className="truncate text-xs text-[var(--shell-muted)]">{BRAND.clientLocation}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <Sidebar page={page} onNavigate={navigate} />
        </div>
        {role === 'resident' && (
          <div className="border-t border-[var(--shell-line)] px-4 py-4">
            <UnitSelector
              units={units}
              currentUnit={currentUnit}
              setCurrentUnit={setCurrentUnit}
            />
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <header className="shell-header sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-3 py-2.5 pt-safe lg:hidden sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 rounded-lg p-2 text-[var(--shell-mist)] hover:bg-[var(--shell-hover)]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="shell-brand-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--shell-mist)] sm:text-base">{BRAND.clientName}</p>
            <p className="truncate text-[10px] text-[var(--shell-muted)] sm:text-xs">{BRAND.clientLocation}</p>
          </div>
        </div>
        <TopUserBar role={role} user={user} onSignOut={signOut} compact onDark />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[#0a1f14]/55 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="shell-sidebar absolute left-0 top-0 flex h-full w-[min(100vw-3rem,18rem)] flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--shell-line)] px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="shell-brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-[var(--shell-mist)]">{BRAND.clientName}</p>
                  <p className="truncate text-xs text-[var(--shell-muted)]">{BRAND.clientLocation}</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="shrink-0 rounded-lg p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-hover)] hover:text-[var(--shell-mist)]" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <Sidebar page={page} onNavigate={navigate} />
            </div>
            {role === 'resident' && (
              <div className="border-t border-[var(--shell-line)] px-4 py-4">
                <UnitSelector units={units} currentUnit={currentUnit} setCurrentUnit={setCurrentUnit} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <header className="shell-header sticky top-0 z-20 hidden border-b lg:block">
          <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3 lg:px-8">
            <TopUserBar role={role} user={user} onSignOut={signOut} onDark />
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-3 py-4 pb-28 sm:px-4 sm:py-6 lg:px-8 lg:py-8 lg:pb-8">
          {renderPage()}
          <BrandFooter className="mt-10 pb-4" />
        </div>
      </main>

      <AssistantWidget />
    </div>
  );
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Admin';
  if (role === 'guard') return 'Guard';
  return 'Owner';
}

function UnitSelector({
  units,
  currentUnit,
  setCurrentUnit,
}: {
  units: Unit[];
  currentUnit: Unit | null;
  setCurrentUnit: (u: Unit | null) => void;
}) {
  if (units.length <= 1) {
    const u = currentUnit ?? units[0];
    return (
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">Your Unit</p>
        <p className="rounded-xl border border-[var(--shell-line)] bg-white/5 px-3 py-2 text-sm font-medium text-white">
          {u ? `${u.unit_number} — ${u.owner_name}` : 'No unit linked'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">Your Unit</p>
      <select
        value={currentUnit?.id ?? ''}
        onChange={(e) => {
          const u = units.find((u) => u.id === e.target.value);
          if (u) setCurrentUnit(u);
        }}
        className="w-full rounded-xl border border-[var(--shell-line)] bg-[#0a1f14]/55 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
      >
        {units.map((u) => (
          <option key={u.id} value={u.id} className="bg-[#123526] text-white">
            {u.unit_number} — {u.owner_name}
          </option>
        ))}
      </select>
    </div>
  );
}

function TopUserBar({
  role,
  user,
  onSignOut,
  compact = false,
  onDark = false,
}: {
  role: string;
  user: { email: string; display_name?: string; phone_number?: string | null } | null;
  onSignOut: () => Promise<void>;
  compact?: boolean;
  onDark?: boolean;
}) {
  const { updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const label = roleLabel(role);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setOpen(false);
      await onSignOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const openEdit = () => {
    setName(user?.display_name ?? '');
    setPhone(user?.phone_number ?? '');
    setFormError('');
    setOpen(false);
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await updateProfile({
        display_name: name.trim(),
        phone_number: phone.trim(),
      });
      setEditOpen(false);
    } catch {
      setFormError('Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border font-semibold transition-colors',
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
            onDark
              ? 'border-[var(--shell-line)] text-white hover:bg-[var(--shell-hover)]'
              : 'border-slate-300 text-slate-800 hover:bg-slate-50',
          )}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <UserRound className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          {label}
          <ChevronDown className={cn('h-3.5 w-3.5 opacity-80 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Signed in as</p>
              <div className="mt-1 flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <p className="break-all text-sm font-medium text-slate-800">{user.email}</p>
              </div>
              {user.display_name && (
                <p className="mt-1 truncate text-xs text-slate-500">{user.display_name}</p>
              )}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={openEdit}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserRound className="h-4 w-4 text-slate-500" />
              Edit Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          {formError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
          )}
          <Input label="Full name" value={name} onChange={setName} placeholder="Your name" required />
          <Input label="Phone" value={phone} onChange={setPhone} placeholder="Mobile number" />
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Email</p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
              {user.email}
            </p>
            <p className="mt-1 text-xs text-slate-400">Email cannot be changed here</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveProfile()} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-teal-600" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
