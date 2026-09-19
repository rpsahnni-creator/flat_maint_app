import { useApp } from '@/context/AppContext';
import { LayoutDashboard, Receipt, Wallet, FileText, Users, Shield, CalendarDays, Siren, MessageSquare, Building2, SlidersHorizontal } from 'lucide-react';
import type { Role } from '@/types';

export type PageId =
  | 'dashboard'
  | 'billing'
  | 'payments'
  | 'expenses'
  | 'notices'
  | 'units'
  | 'visitors'
  | 'amenities'
  | 'sos'
  | 'complaints'
  | 'settings';

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'resident'] },
  { id: 'billing', label: 'Billing', icon: Receipt, roles: ['admin', 'resident'] },
  { id: 'payments', label: 'Payments', icon: Wallet, roles: ['admin', 'resident'] },
  { id: 'expenses', label: 'Expenses', icon: FileText, roles: ['admin'] },
  { id: 'units', label: 'Units', icon: Users, roles: ['admin'] },
  { id: 'notices', label: 'Notice Board', icon: Building2, roles: ['admin', 'resident'] },
  { id: 'visitors', label: 'Visitors', icon: Shield, roles: ['admin', 'resident'] },
  { id: 'amenities', label: 'Amenities', icon: CalendarDays, roles: ['admin', 'resident'] },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare, roles: ['admin', 'resident'] },
  { id: 'sos', label: 'SOS', icon: Siren, roles: ['admin', 'resident'] },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal, roles: ['admin'] },
];

export function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { role } = useApp();
  const items = navItems.filter((i) => i.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = page === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export { navItems };
