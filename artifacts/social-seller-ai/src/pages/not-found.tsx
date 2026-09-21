import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background px-5 text-foreground">
    <div className="max-w-md text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive"><AlertCircle size={24} /></div>
      <p className="mt-6 font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Signal not found / 404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-.06em]">This page moved.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">The route is not part of the current learning path. Your next useful move is still available.</p>
      <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="link-not-found-home"><ArrowLeft size={15} /> Return home</Link>
    </div>
  </div>;
}