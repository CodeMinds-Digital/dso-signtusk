import { useMemo } from "react";

import { Plural, Trans, useLingui } from "@lingui/react/macro";
import {
  Building2Icon,
  InboxIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "react-router";

import { useSession } from "@signtusk/lib/client-only/providers/session";
import { ORGANISATION_MEMBER_ROLE_MAP } from "@signtusk/lib/constants/organisations-translations";
import { TEAM_MEMBER_ROLE_MAP } from "@signtusk/lib/constants/teams-translations";
import { formatAvatarUrl } from "@signtusk/lib/utils/avatars";
import { canExecuteOrganisationAction } from "@signtusk/lib/utils/organisations";
import { canExecuteTeamAction } from "@signtusk/lib/utils/teams";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@signtusk/ui/primitives/avatar";
import { Button } from "@signtusk/ui/primitives/button";
import { Card, CardContent } from "@signtusk/ui/primitives/card";
import { ScrollArea, ScrollBar } from "@signtusk/ui/primitives/scroll-area";

import { OrganisationInvitations } from "~/components/general/organisations/organisation-invitations";
import { InboxTable } from "~/components/tables/inbox-table";
import { appMetaTags } from "~/utils/meta";

export function meta() {
  return appMetaTags("Dashboard");
}

export default function DashboardPage() {
  const { t } = useLingui();

  const { user, organisations, session } = useSession();

  // Todo: Sort by recent access (TBD by cookies)
  // Teams, flattened with the organisation data still attached.
  const teams = useMemo(() => {
    return organisations.flatMap((org) =>
      org.teams.map((team) => ({
        ...team,
        organisation: {
          ...org,
          teams: undefined,
        },
      }))
    );
  }, [organisations]);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6">
      {/* ── Page header ── */}
      <div className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Trans>Dashboard</Trans>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          <Trans>Welcome back! Here's an overview of your account.</Trans>
        </p>

        <OrganisationInvitations className="mt-4" />
      </div>

      {/* ── Empty state ── */}
      {organisations.length === 0 && (
        <div className="mb-12 flex flex-col items-center justify-center rounded-xl border border-dashed py-24">
          <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
            <Building2Icon className="text-muted-foreground h-6 w-6" />
          </div>

          <div className="mt-4 flex flex-col items-center gap-1 text-center">
            <p className="font-semibold">
              <Trans>No organisations found</Trans>
            </p>
            <p className="text-muted-foreground text-sm">
              <Trans>Create an organisation to get started.</Trans>
            </p>
          </div>

          <Button asChild className="mt-6" size="sm">
            <Link to="/settings/organisations?action=add-organisation">
              <Trans>Create organisation</Trans>
            </Link>
          </Button>
        </div>
      )}

      {/* ── Organisations Section ── */}
      {organisations.length > 1 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Building2Icon className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Trans>Organisations</Trans>
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organisations.map((org) => (
              <div key={org.id} className="group relative">
                <Link to={`/o/${org.url}`}>
                  <Card className="hover:shadow-md h-full transition-all duration-200 hover:-translate-y-0.5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="border-border h-9 w-9 border">
                          {org.avatarImageId && (
                            <AvatarImage src={formatAvatarUrl(org.avatarImageId)} />
                          )}
                          <AvatarFallback className="text-muted-foreground text-xs font-medium">
                            {org.name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium">{org.name}</h3>
                          <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <UsersIcon className="h-3 w-3" />
                              <span>
                                {org.ownerUserId === user.id
                                  ? t`Owner`
                                  : t(ORGANISATION_MEMBER_ROLE_MAP[org.currentOrganisationRole])}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2Icon className="h-3 w-3" />
                              <span>
                                <Plural
                                  value={org.teams.length}
                                  one={<Trans># team</Trans>}
                                  other={<Trans># teams</Trans>}
                                />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {canExecuteOrganisationAction("MANAGE_ORGANISATION", org.currentOrganisationRole) && (
                  <div className="text-muted-foreground hover:text-foreground absolute right-3 top-3 opacity-0 transition-all duration-150 group-hover:opacity-100">
                    <Link to={`/o/${org.url}/settings`} className="hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md transition-colors">
                      <SettingsIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Teams Section ── */}
      {teams.length >= 1 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <UsersIcon className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Trans>Teams</Trans>
            </h2>
          </div>

          <ScrollArea className="w-full pb-3">
            <div className="flex gap-3">
              {teams.map((team) => (
                <div key={team.id} className="group relative">
                  <Link to={`/t/${team.url}`}>
                    <Card className="hover:shadow-md w-[300px] shrink-0 transition-all duration-200 hover:-translate-y-0.5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="border-border h-9 w-9 border">
                            {team.avatarImageId && (
                              <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />
                            )}
                            <AvatarFallback className="text-muted-foreground text-xs font-medium">
                              {team.name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium">{team.name}</h3>
                            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" />
                                <span>
                                  {team.organisation.ownerUserId === user.id
                                    ? t`Owner`
                                    : t(TEAM_MEMBER_ROLE_MAP[team.currentTeamRole])}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2Icon className="h-3 w-3" />
                                <span className="truncate">{team.organisation.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground mt-3 text-xs">
                          <Trans>
                            Joined{" "}
                            {DateTime.fromJSDate(team.createdAt).toRelative({ style: "short" })}
                          </Trans>
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  {canExecuteTeamAction("MANAGE_TEAM", team.currentTeamRole) && (
                    <div className="text-muted-foreground hover:text-foreground absolute right-3 top-3 opacity-0 transition-all duration-150 group-hover:opacity-100">
                      <Link to={`/t/${team.url}/settings`} className="hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md transition-colors">
                        <SettingsIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* ── Inbox Section ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <InboxIcon className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trans>Personal Inbox</Trans>
          </h2>
        </div>

        <InboxTable />
      </section>
    </div>
  );
}
