import { Apple } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex items-center gap-4" aria-label="车险洞察仪表板">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur">
        <Apple className="h-6 w-6 text-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground/70">Autinsight</span>
        <h1 className="font-headline text-2xl font-semibold tracking-[-0.04em] text-foreground">
          车险洞察仪表板
        </h1>
      </div>
    </div>
  );
}
