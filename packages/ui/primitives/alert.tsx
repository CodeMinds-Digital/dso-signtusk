import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

import { cn } from '../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl p-4 [&>svg]:absolute [&>svg]:text-foreground [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-8',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-50 text-emerald-700 [&_.alert-title]:text-emerald-800 [&>svg]:text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 dark:[&_.alert-title]:text-emerald-200 dark:[&>svg]:text-emerald-400',
        neutral:
          'bg-muted/60 text-muted-foreground [&_.alert-title]:text-foreground dark:bg-muted/30',
        secondary:
          'bg-blue-50 text-blue-700 [&_.alert-title]:text-blue-800 [&>svg]:text-blue-500 dark:bg-blue-950/40 dark:text-blue-300 dark:[&_.alert-title]:text-blue-200 dark:[&>svg]:text-blue-400',
        destructive:
          'bg-destructive/10 text-destructive [&_.alert-title]:text-destructive [&>svg]:text-destructive dark:bg-destructive/20',
        warning:
          'bg-amber-50 text-amber-700 [&_.alert-title]:text-amber-800 [&>svg]:text-amber-500 dark:bg-amber-950/40 dark:text-amber-300 dark:[&_.alert-title]:text-amber-200 dark:[&>svg]:text-amber-400',
      },
      padding: {
        tighter: 'p-2',
        tight: 'px-4 py-2',
        default: 'p-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, padding, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn('space-y-2', alertVariants({ variant, padding }), className)}
    {...props}
  />
));

Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('alert-title text-sm font-semibold', className)} {...props} />
  ),
);

AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm', className)} {...props} />
));

AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
