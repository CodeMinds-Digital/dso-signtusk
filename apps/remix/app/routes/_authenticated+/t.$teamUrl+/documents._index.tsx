import { useEffect, useMemo, useState } from "react";

import { Trans } from "@lingui/react/macro";
import {
  EnvelopeType,
  FolderType,
  OrganisationType,
} from "@signtusk/lib/constants/prisma-enums";
import { PlusIcon } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { z } from "zod";

import { useCurrentOrganisation } from "@signtusk/lib/client-only/providers/organisation";
import { formatAvatarUrl } from "@signtusk/lib/utils/avatars";
import { parseToIntegerArray } from "@signtusk/lib/utils/params";
import { formatDocumentsPath } from "@signtusk/lib/utils/teams";
import { ExtendedDocumentStatus } from "@signtusk/prisma/types/extended-document-status";
import { trpc } from "@signtusk/trpc/react";
import type { TFindDocumentsInternalResponse } from "@signtusk/trpc/server/document-router/find-documents-internal.types";
import { ZFindDocumentsInternalRequestSchema } from "@signtusk/trpc/server/document-router/find-documents-internal.types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@signtusk/ui/primitives/avatar";
import { Tabs, TabsList, TabsTrigger } from "@signtusk/ui/primitives/tabs";

import { DocumentMoveToFolderDialog } from "~/components/dialogs/document-move-to-folder-dialog";
import { DocumentSearch } from "~/components/general/document/document-search";
import { DocumentStatus } from "~/components/general/document/document-status";
import { EnvelopeDropZoneWrapper } from "~/components/general/envelope/envelope-drop-zone-wrapper";
import { FolderGrid } from "~/components/general/folder/folder-grid";
import { PeriodSelector } from "~/components/general/period-selector";
import { DocumentsTable } from "~/components/tables/documents-table";
import { DocumentsTableEmptyState } from "~/components/tables/documents-table-empty-state";
import { DocumentsTableSenderFilter } from "~/components/tables/documents-table-sender-filter";
import { useCurrentTeam } from "~/providers/team";
import { appMetaTags } from "~/utils/meta";

export function meta() {
  return appMetaTags("Documents");
}

const ZSearchParamsSchema = ZFindDocumentsInternalRequestSchema.pick({
  status: true,
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  senderIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});

export default function DocumentsPage() {
  const organisation = useCurrentOrganisation();
  const team = useCurrentTeam();

  const { folderId } = useParams();
  const [searchParams] = useSearchParams();

  const [isMovingDocument, setIsMovingDocument] = useState(false);
  const [documentToMove, setDocumentToMove] = useState<number | null>(null);

  const [stats, setStats] = useState<TFindDocumentsInternalResponse["stats"]>({
    [ExtendedDocumentStatus.DRAFT]: 0,
    [ExtendedDocumentStatus.PENDING]: 0,
    [ExtendedDocumentStatus.COMPLETED]: 0,
    [ExtendedDocumentStatus.REJECTED]: 0,
    [ExtendedDocumentStatus.INBOX]: 0,
    [ExtendedDocumentStatus.ALL]: 0,
  });

  const findDocumentSearchParams = useMemo(
    () =>
      ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries()))
        .data || {},
    [searchParams]
  );

  const { data, isLoading, isLoadingError } =
    trpc.document.findDocumentsInternal.useQuery({
      ...findDocumentSearchParams,
      folderId,
    });

  const getTabHref = (value: keyof typeof ExtendedDocumentStatus) => {
    const params = new URLSearchParams(searchParams);

    params.set("status", value);

    if (value === ExtendedDocumentStatus.ALL) {
      params.delete("status");
    }

    if (
      value === ExtendedDocumentStatus.INBOX &&
      organisation.type === OrganisationType.PERSONAL
    ) {
      params.delete("status");
    }

    if (params.has("page")) {
      params.delete("page");
    }

    let path = formatDocumentsPath(team.url);

    if (folderId) {
      path += `/f/${folderId}`;
    }

    if (params.toString()) {
      path += `?${params.toString()}`;
    }

    return path;
  };

  useEffect(() => {
    if (data?.stats) {
      setStats(data.stats);
    }
  }, [data?.stats]);

  return (
    <EnvelopeDropZoneWrapper type={EnvelopeType.DOCUMENT}>
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6">
        <FolderGrid type={FolderType.DOCUMENT} parentId={folderId ?? null} />

        {/* ── Sticky page header ── */}
        <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="border-border h-9 w-9 border">
                {team.avatarImageId && (
                  <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />
                )}
                <AvatarFallback className="text-muted-foreground text-xs font-medium">
                  {team.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  <Trans>Documents</Trans>
                </h1>
                <p className="text-muted-foreground text-xs">{team.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {team && <DocumentsTableSenderFilter teamId={team.id} />}
              <PeriodSelector />
              <DocumentSearch initialValue={findDocumentSearchParams.query} />
              <Link
                to={`/t/${team.url}/documents/new`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <PlusIcon className="h-4 w-4" />
                <Trans>New Document</Trans>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Status tabs ── */}
        <div className="mb-6">
          <Tabs
            value={findDocumentSearchParams.status || "ALL"}
            className="w-full overflow-x-auto"
          >
            <TabsList className="h-10 gap-1 rounded-none border-b-0 bg-transparent p-0">
              {[
                ExtendedDocumentStatus.INBOX,
                ExtendedDocumentStatus.PENDING,
                ExtendedDocumentStatus.COMPLETED,
                ExtendedDocumentStatus.DRAFT,
                ExtendedDocumentStatus.ALL,
              ]
                .filter((value) => {
                  if (organisation.type === OrganisationType.PERSONAL) {
                    return value !== ExtendedDocumentStatus.INBOX;
                  }
                  return true;
                })
                .map((value) => (
                  <TabsTrigger
                    key={value}
                    className="hover:text-foreground data-[state=active]:shadow-[inset_0_-2px_0_0_hsl(var(--primary))] h-10 rounded-none px-3 text-sm data-[state=active]:bg-transparent"
                    value={value}
                    asChild
                  >
                    <Link to={getTabHref(value)} preventScrollReset>
                      <DocumentStatus status={value} />
                      {value !== ExtendedDocumentStatus.ALL && stats[value] > 0 && (
                        <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                          {stats[value]}
                        </span>
                      )}
                    </Link>
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
        </div>

        {/* ── Table ── */}
        <div>
          {data && data.count === 0 ? (
            <DocumentsTableEmptyState
              status={findDocumentSearchParams.status || ExtendedDocumentStatus.ALL}
            />
          ) : (
            <DocumentsTable
              data={data}
              isLoading={isLoading}
              isLoadingError={isLoadingError}
              onMoveDocument={(documentId) => {
                setDocumentToMove(documentId);
                setIsMovingDocument(true);
              }}
            />
          )}
        </div>

        {documentToMove && (
          <DocumentMoveToFolderDialog
            documentId={documentToMove}
            open={isMovingDocument}
            currentFolderId={folderId}
            onOpenChange={(open) => {
              setIsMovingDocument(open);
              if (!open) {
                setDocumentToMove(null);
              }
            }}
          />
        )}
      </div>
    </EnvelopeDropZoneWrapper>
  );
}
