import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  FileText,
  Users,
  Shield,
  CalendarDays,
  Siren,
  MessageSquare,
  Building2,
  SlidersHorizontal,
  Phone,
  MessageCircle,
} from 'lucide-react';
import type { Role } from '@/types';
import { cn } from '@/lib/utils';

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
  | 'settings'
  | 'directory'
  | 'chat';

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Gate Desk', icon: LayoutDashboard, roles: ['guard'] },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'resident'] },
  { id: 'visitors', label: 'Visitors', icon: Shield, roles: ['admin', 'resident', 'guard'] },
  { id: 'directory', label: 'Flat Owners', icon: Phone, roles: ['guard'] },
  { id: 'chat', label: 'Owner Chat', icon: MessageCircle, roles: ['guard'] },
  { id: 'chat', label: 'Gate Chat', icon: MessageCircle, roles: ['resident'] },
  { id: 'units', label: 'Units', icon: Users, roles: ['admin'] },
  { id: 'billing', label: 'Billing', icon: Receipt, roles: ['admin', 'resident'] },
  { id: 'payments', label: 'Payments', icon: Wallet, roles: ['admin', 'resident'] },
  { id: 'expenses', label: 'Expenses', icon: FileText, roles: ['admin'] },
  { id: 'notices', label: 'Notice Board', icon: Building2, roles: ['admin', 'resident', 'guard'] },
  { id: 'amenities', label: 'Amenities', icon: CalendarDays, roles: ['admin', 'resident'] },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare, roles: ['admin', 'resident'] },
  { id: 'sos', label: 'SOS Alerts', icon: Siren, roles: ['admin', 'resident', 'guard'] },
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
            key={`${item.id}-${item.label}`}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-[var(--shell-active)] text-white shadow-lg shadow-[rgba(47,158,106,0.28)]'
                : 'text-[var(--shell-muted)] hover:bg-[var(--shell-hover)] hover:text-[var(--shell-mist)]',
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-white/70')} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export { navItems };
