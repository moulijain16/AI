import { ArrowUpRight } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      <div className="relative grid size-9 place-items-center bg-secondary text-primary">
        <span className="font-mono-ui text-[11px] font-medium tracking-[-.08em]">S/</span>
        <span className="absolute -right-1 -top-1 grid size-3 place-items-center bg-accent text-primary"><ArrowUpRight size={8} strokeWidth={3} /></span>
      </div>
      {!compact && <div className="leading-none"><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.2em]">Social Seller</p><p className="mt-1 text-sm font-semibold tracking-tight">AI studio</p></div>}
    </div>
  );
}