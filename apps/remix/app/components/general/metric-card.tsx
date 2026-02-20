import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import { cn } from '@signtusk/ui/lib/utils';

export type CardMetricProps = {
  icon?: LucideIcon;
  title: string;
  value: string | number;
  className?: string;
};

export const CardMetric = ({ icon: Icon, title, value, className }: CardMetricProps) => {
  return (
    <div
      className={cn(
        'border-border bg-card rounded-xl border p-5 transition-shadow duration-200 hover:shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-muted-foreground h-4 w-4 shrink-0" />}
        <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {title}
        </h3>
      </div>

      <p className="text-foreground mt-3 text-3xl font-semibold leading-none tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </p>
    </div>
  );
};
