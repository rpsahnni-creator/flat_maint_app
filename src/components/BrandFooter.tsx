import { BRAND } from '@/lib/brand';

export function BrandFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`text-center text-xs text-slate-400 ${className}`}>
      <p className="font-medium text-slate-500">{BRAND.clientFull}</p>
      <p className="mt-0.5">{BRAND.developedBy}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide">{BRAND.amcNote}</p>
    </footer>
  );
}
