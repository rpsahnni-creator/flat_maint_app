import { BRAND } from '@/lib/brand';

export function BrandFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`text-center text-xs ${className}`}>
      <p className="font-medium text-[#9f1239]">{BRAND.clientFull}</p>
      <p className="mt-0.5 text-[#9f1239]">
        Developed by:{' '}
        <a
          href={BRAND.developerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#9f1239] underline-offset-2 hover:underline"
        >
          {BRAND.developer}
        </a>
      </p>
    </footer>
  );
}
