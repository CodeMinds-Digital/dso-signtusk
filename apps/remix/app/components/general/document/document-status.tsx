import type { HTMLAttributes } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { CheckCircle2, Clock, File, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import type { ExtendedDocumentStatus } from '@signtusk/prisma/types/extended-document-status';
import { SignatureIcon } from '@signtusk/ui/icons/signature';
import { cn } from '@signtusk/ui/lib/utils';

type FriendlyStatus = {
  label: MessageDescriptor;
  labelExtended: MessageDescriptor;
  icon?: LucideIcon;
  color: string;
};

export const FRIENDLY_STATUS_MAP: Record<ExtendedDocumentStatus, FriendlyStatus> = {
  PENDING: {
    label: msg`Pending`,
    labelExtended: msg`Document pending`,
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
  },
  COMPLETED: {
    label: msg`Completed`,
    labelExtended: msg`Document completed`,
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  DRAFT: {
    label: msg`Draft`,
    labelExtended: msg`Document draft`,
    icon: File,
    color: 'text-amber-600 dark:text-amber-400',
  },
  REJECTED: {
    label: msg`Rejected`,
    labelExtended: msg`Document rejected`,
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
  },
  INBOX: {
    label: msg`Inbox`,
    labelExtended: msg`Document inbox`,
    icon: SignatureIcon,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  ALL: {
    label: msg`All`,
    labelExtended: msg`Document All`,
    color: 'text-muted-foreground',
  },
};

export type DocumentStatusProps = HTMLAttributes<HTMLSpanElement> & {
  status: ExtendedDocumentStatus;
  inheritColor?: boolean;
};

export const DocumentStatus = ({
  className,
  status,
  inheritColor,
  ...props
}: DocumentStatusProps) => {
  const { _ } = useLingui();

  const { label, icon: Icon, color } = FRIENDLY_STATUS_MAP[status];

  return (
    <span className={cn('flex items-center gap-1.5', className)} {...props}>
      {Icon && (
        <Icon
          className={cn('inline-block h-3.5 w-3.5 shrink-0', {
            [color]: !inheritColor,
          })}
        />
      )}
      {_(label)}
    </span>
  );
};
