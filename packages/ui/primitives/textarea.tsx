import * as React from 'react';

import { cn } from '../lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'border-input ring-offset-background placeholder:text-muted-foreground/40 focus-visible:ring-ring flex min-h-20 w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:border-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-50',
          className,
          {
            'ring-2 !ring-destructive border-destructive': props['aria-invalid'],
          },
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
