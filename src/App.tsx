import { useState } from 'react';
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
import { AssistantWidget } from '@/components/AssistantWidget';
import { BrandFooter } from '@/components/BrandFooter';
import { BRAND } from '@/lib/brand';
import type { Unit } from '@/types';
import { Building2, Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

function AppShell() {
  const { role, currentUnit, setCurrentUnit, units, loading } = useApp();
  const { user, signOut } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

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

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
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
      default: return <Dashboard onNavigate={navigate} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar — nav only */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight text-slate-900">{BRAND.clientName}</p>
            <p className="truncate text-xs text-slate-400">{BRAND.clientLocation}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <Sidebar page={page} onNavigate={navigate} />
        </div>
        {role === 'resident' && (
          <div className="border-t border-slate-200 px-4 py-4">
            <UnitSelector
              units={units}
              currentUnit={currentUnit}
              setCurrentUnit={setCurrentUnit}
            />
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur pt-safe lg:hidden sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 sm:h-9 sm:w-9">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 sm:text-base">{BRAND.clientName}</p>
            <p className="truncate text-[10px] text-slate-400 sm:text-xs">{BRAND.clientLocation}</p>
          </div>
        </div>
        <TopUserBar role={role} user={user} onSignOut={signOut} compact />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[min(100vw-3rem,18rem)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{BRAND.clientName}</p>
                  <p className="truncate text-xs text-slate-400">{BRAND.clientLocation}</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <Sidebar page={page} onNavigate={navigate} />
            </div>
            {role === 'resident' && (
              <div className="border-t border-slate-200 px-4 py-4">
                <UnitSelector units={units} currentUnit={currentUnit} setCurrentUnit={setCurrentUnit} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/95 backdrop-blur lg:block">
          <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3 lg:px-8">
            <TopUserBar role={role} user={user} onSignOut={signOut} />
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

function UnitSelector({
  units,
  currentUnit,
  setCurrentUnit,
}: {
  units: Unit[];
  currentUnit: Unit | null;
  setCurrentUnit: (u: Unit | null) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase text-slate-400">Your Unit</p>
      <select
        value={currentUnit?.id ?? ''}
        onChange={(e) => {
          const u = units.find((u) => u.id === e.target.value);
          if (u) setCurrentUnit(u);
        }}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
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
}: {
  role: string;
  user: { email: string; display_name?: string } | null;
  onSignOut: () => Promise<void>;
  compact?: boolean;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await onSignOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right min-w-0 hidden sm:block">
          <p className="text-xs font-medium text-slate-900 truncate max-w-[140px]">{user.email}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{role}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5',
            'text-xs font-medium text-slate-700 hover:bg-slate-50',
            isSigningOut && 'opacity-50 cursor-not-allowed',
          )}
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Role</p>
        <p className="text-sm font-semibold text-slate-800 capitalize">{role}</p>
      </div>
      <div className="h-8 w-px bg-slate-200" />
      <div className="text-right min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate max-w-[220px]">{user.email}</p>
        <p className="text-xs text-slate-500">Logged in</p>
      </div>
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2',
          'text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors',
          isSigningOut && 'opacity-50 cursor-not-allowed',
        )}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
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
