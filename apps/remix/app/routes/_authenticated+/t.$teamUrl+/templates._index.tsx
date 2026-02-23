import { Trans } from "@lingui/react/macro";
import { EnvelopeType } from "@signtusk/lib/constants/prisma-enums";
import { LayoutTemplateIcon, PlusIcon } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import { FolderType } from "@signtusk/lib/types/folder-type";
import { formatAvatarUrl } from "@signtusk/lib/utils/avatars";
import {
  formatDocumentsPath,
  formatTemplatesPath,
} from "@signtusk/lib/utils/teams";
import { trpc } from "@signtusk/trpc/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@signtusk/ui/primitives/avatar";

import { EnvelopeDropZoneWrapper } from "~/components/general/envelope/envelope-drop-zone-wrapper";
import { FolderGrid } from "~/components/general/folder/folder-grid";
import { TemplatesTable } from "~/components/tables/templates-table";
import { useCurrentTeam } from "~/providers/team";
import { appMetaTags } from "~/utils/meta";

export function meta() {
  return appMetaTags("Templates");
}

export default function TemplatesPage() {
  const team = useCurrentTeam();

  const { folderId } = useParams();
  const [searchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const perPage = Number(searchParams.get("perPage")) || 10;

  const documentRootPath = formatDocumentsPath(team.url);
  const templateRootPath = formatTemplatesPath(team.url);

  const { data, isLoading, isLoadingError } =
    trpc.template.findTemplates.useQuery({
      page: page,
      perPage: perPage,
      folderId,
    });

  return (
    <EnvelopeDropZoneWrapper type={EnvelopeType.TEMPLATE}>
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">
        <FolderGrid type={FolderType.TEMPLATE} parentId={folderId ?? null} />

        {/* ── Sticky page header ── */}
        <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-2 py-4">
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
                <h1 className="truncate text-xl font-semibold tracking-tight">
                  <Trans>Templates</Trans>
                </h1>
                <p className="text-muted-foreground text-xs">{team.name}</p>
              </div>
            </div>

            <Link
              to={`/t/${team.url}/templates/new`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4" />
              <Trans>New Template</Trans>
            </Link>
          </div>
        </div>

        {/* ── Content ── */}
        <div>
          {data && data.count === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
              <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
                <LayoutTemplateIcon className="text-muted-foreground h-7 w-7" strokeWidth={1.5} />
              </div>

              <div className="mt-4">
                <h3 className="font-semibold">
                  <Trans>No templates yet</Trans>
                </h3>
                <p className="text-muted-foreground mt-1 max-w-[40ch] text-sm">
                  <Trans>
                    You have not yet created any templates. Upload a document to create one.
                  </Trans>
                </p>
              </div>

              <Link
                to={`/t/${team.url}/templates/new`}
                className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                <Trans>Create template</Trans>
              </Link>
            </div>
          ) : (
            <TemplatesTable
              data={data}
              isLoading={isLoading}
              isLoadingError={isLoadingError}
              documentRootPath={documentRootPath}
              templateRootPath={templateRootPath}
            />
          )}
        </div>
      </div>
    </EnvelopeDropZoneWrapper>
  );
}
