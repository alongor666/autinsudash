import { Car } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="车险洞察仪表板">
      <div className="p-1.5 bg-primary rounded-lg">
        <Car className="h-5 w-5 text-primary-foreground" />
      </div>
      <h1 className="text-lg font-semibold tracking-tight">车险洞察</h1>
    </div>
  );
}
