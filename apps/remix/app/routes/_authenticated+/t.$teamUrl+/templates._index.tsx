import { Trans } from "@lingui/react/macro";
import { EnvelopeType } from "@signtusk/lib/constants/prisma-enums";
import { Bird } from "lucide-react";
import { useParams, useSearchParams } from "react-router";

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

        {/* ── Page header ── */}
        <div className="mt-6 mb-6 flex items-center gap-3 border-b pb-5">
          <Avatar className="border-border h-9 w-9 border">
            {team.avatarImageId && (
              <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />
            )}
            <AvatarFallback className="text-muted-foreground text-xs font-medium">
              {team.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>

          <h1 className="truncate text-xl font-semibold tracking-tight">
            <Trans>Templates</Trans>
          </h1>
        </div>

        {/* ── Content ── */}
        <div>
          {data && data.count === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed">
              <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
                <Bird className="text-muted-foreground h-6 w-6" strokeWidth={1.5} />
              </div>

              <div className="mt-4 text-center">
                <h3 className="font-semibold">
                  <Trans>No templates yet</Trans>
                </h3>
                <p className="text-muted-foreground mt-1 max-w-[40ch] text-sm">
                  <Trans>
                    You have not yet created any templates. Upload a document to create one.
                  </Trans>
                </p>
              </div>
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
