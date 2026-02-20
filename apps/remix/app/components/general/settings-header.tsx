import React from 'react';

import { cn } from '@signtusk/ui/lib/utils';

export type SettingsHeaderProps = {
  title: string | React.ReactNode;
  subtitle: string | React.ReactNode;
  hideDivider?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export const SettingsHeader = ({
  children,
  title,
  subtitle,
  className,
  hideDivider,
}: SettingsHeaderProps) => {
  return (
    <>
      <div className={cn('flex flex-row items-start justify-between gap-4', className)}>
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>

          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{subtitle}</p>
        </div>

        {children}
      </div>

      {!hideDivider && <hr className="my-5" />}
    </>
  );
};
