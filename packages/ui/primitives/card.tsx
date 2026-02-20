import * as React from 'react';

import { cn } from '../lib/utils';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  spotlight?: boolean;
  gradient?: boolean;
  degrees?: number;

  /**
   * Not sure if this is needed, but added a toggle so it defaults to true since that was how it was before.
   *
   * This is required to be set false if you want drag drop to work within this element.
   */
  backdropBlur?: boolean;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, children, gradient = false, degrees = 120, backdropBlur = true, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        style={
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            '--card-gradient-degrees': `${degrees}deg`,
          } as React.CSSProperties
        }
        className={cn(
          'bg-card text-card-foreground group relative rounded-xl border shadow-sm transition-shadow duration-200',
          {
            'backdrop-blur-[2px]': backdropBlur,
            'gradient-border-mask before:pointer-events-none before:absolute before:-inset-[1px] before:rounded-xl before:p-[1px] before:[background:linear-gradient(var(--card-gradient-degrees),theme(colors.primary.DEFAULT/60%)_5%,theme(colors.border/70%)_35%)]':
              gradient,
            'dark:gradient-border-mask before:pointer-events-none before:absolute before:-inset-[1px] before:rounded-xl before:p-[1px] before:[background:linear-gradient(var(--card-gradient-degrees),theme(colors.primary.DEFAULT/80%)_5%,theme(colors.border/60%)_35%)]':
              gradient,
          },
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-4', className)} {...props} />
  ),
);

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-snug tracking-tight text-foreground', className)}
      {...props}
    />
  ),
);

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props} />
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 p-6 pt-0', className)} {...props} />
  ),
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
