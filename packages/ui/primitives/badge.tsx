import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full text-xs font-medium ring-1 ring-inset w-fit tracking-wide',
  {
    variants: {
      variant: {
        neutral:
          'bg-slate-50 text-slate-600 ring-slate-500/15 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20',
        destructive:
          'bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/25',
        warning:
          'bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/25',
        default:
          'bg-emerald-50 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/25',
        secondary:
          'bg-indigo-50 text-indigo-700 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/25',
      },
      size: {
        small: 'px-2 py-0.5 text-[11px]',
        default: 'px-2.5 py-1 text-xs',
        large: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div role="status" className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
