import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Bird, CheckCircle2 } from 'lucide-react';
import { match } from 'ts-pattern';

import { ExtendedDocumentStatus } from '@signtusk/prisma/types/extended-document-status';

export type DocumentsTableEmptyStateProps = { status: ExtendedDocumentStatus };

export const DocumentsTableEmptyState = ({ status }: DocumentsTableEmptyStateProps) => {
  const { _ } = useLingui();

  const {
    title,
    message,
    icon: Icon,
  } = match(status)
    .with(ExtendedDocumentStatus.COMPLETED, () => ({
      title: msg`Nothing to do`,
      message: msg`There are no completed documents yet. Documents that you have created or received will appear here once completed.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.DRAFT, () => ({
      title: msg`No active drafts`,
      message: msg`There are no active drafts at the current moment. You can upload a document to start drafting.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.ALL, () => ({
      title: msg`We're all empty`,
      message: msg`You have not yet created or received any documents. To create a document please upload one.`,
      icon: Bird,
    }))
    .otherwise(() => ({
      title: msg`Nothing to do`,
      message: msg`All documents have been processed. Any new documents that are sent or received will show here.`,
      icon: CheckCircle2,
    }));

  return (
    <div
      className="flex h-64 flex-col items-center justify-center gap-y-3"
      data-testid="empty-document-state"
    >
      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-6 w-6" strokeWidth={1.5} />
      </div>

      <div className="text-center">
        <h3 className="font-semibold">{_(title)}</h3>
        <p className="text-muted-foreground mt-1 max-w-[52ch] text-sm">{_(message)}</p>
      </div>
    </div>
  );
};
