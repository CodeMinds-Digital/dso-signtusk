import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  BracesIcon,
  Globe2Icon,
  GroupIcon,
  Settings2Icon,
  SettingsIcon,
  Users2Icon,
  WebhookIcon,
} from 'lucide-react';
import { Link, NavLink, Outlet, redirect } from 'react-router';

import { getSession } from '@signtusk/auth/server/lib/utils/get-session';
import { getTeamByUrl } from '@signtusk/lib/server-only/team/get-team';
import { canExecuteTeamAction } from '@signtusk/lib/utils/teams';
import { Button } from '@signtusk/ui/primitives/button';
import { cn } from '@signtusk/ui/lib/utils';

import { GenericErrorLayout } from '~/components/general/generic-error-layout';
import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/settings._layout';

export function meta() {
  return appMetaTags('Team Settings');
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request);

  const team = await getTeamByUrl({
    userId: session.user.id,
    teamUrl: params.teamUrl,
  });

  if (!team || !canExecuteTeamAction('MANAGE_TEAM', team.currentTeamRole)) {
    throw redirect(`/t/${params.teamUrl}`);
  }
}

export async function clientLoader() {
  // Do nothing, we only want the loader to run on SSR.
}

export default function TeamsSettingsLayout() {
  const { t } = useLingui();

  const team = useCurrentTeam();

  const teamSettingRoutes = [
    {
      path: `/t/${team.url}/settings`,
      label: t`General`,
      icon: SettingsIcon,
    },
    {
      path: `/t/${team.url}/settings/document`,
      label: t`Preferences`,
      icon: Settings2Icon,
      isSubNavParent: true,
    },
    {
      path: `/t/${team.url}/settings/document`,
      label: t`Document`,
      isSubNav: true,
    },
    {
      path: `/t/${team.url}/settings/branding`,
      label: t`Branding`,
      isSubNav: true,
    },
    {
      path: `/t/${team.url}/settings/email`,
      label: t`Email`,
      isSubNav: true,
    },
    {
      path: `/t/${team.url}/settings/public-profile`,
      label: t`Public Profile`,
      icon: Globe2Icon,
    },
    {
      path: `/t/${team.url}/settings/members`,
      label: t`Members`,
      icon: Users2Icon,
    },
    {
      path: `/t/${team.url}/settings/groups`,
      label: t`Groups`,
      icon: GroupIcon,
    },
    {
      path: `/t/${team.url}/settings/tokens`,
      label: t`API Tokens`,
      icon: BracesIcon,
    },
    {
      path: `/t/${team.url}/settings/webhooks`,
      label: t`Webhooks`,
      icon: WebhookIcon,
    },
  ];

  if (!canExecuteTeamAction('MANAGE_TEAM', team.currentTeamRole)) {
    return (
      <GenericErrorLayout
        errorCode={401}
        errorCodeMap={{
          401: {
            heading: msg`Unauthorized`,
            subHeading: msg`401 Unauthorized`,
            message: msg`You are not authorized to access this page.`,
          },
        }}
        primaryButton={
          <Button asChild>
            <Link to={`/t/${team.url}`}>
              <Trans>Go Back</Trans>
            </Link>
          </Button>
        }
        secondaryButton={null}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
      <div className="mb-6 border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Trans>Team Settings</Trans>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          <Trans>Manage your team preferences and members.</Trans>
        </p>
      </div>

      <div className="grid grid-cols-12 gap-x-8">
        {/* Desktop nav */}
        <div className="col-span-12 hidden md:col-span-3 md:flex md:flex-col md:gap-1">
          {teamSettingRoutes.map((route) => (
            <NavLink
              to={route.path}
              end={route.path === `/t/${team.url}/settings`}
              key={route.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  route.isSubNav && 'ml-4',
                  isActive && !route.isSubNavParent
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              {route.icon && <route.icon className="h-4 w-4 shrink-0" />}
              <Trans>{route.label}</Trans>
            </NavLink>
          ))}
        </div>

        {/* Mobile nav */}
        <div className="col-span-12 mb-6 flex flex-wrap gap-2 md:hidden">
          {teamSettingRoutes
            .filter((r) => !r.isSubNav)
            .map((route) => (
              <NavLink
                to={route.path}
                end={route.path === `/t/${team.url}/settings`}
                key={route.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                    isActive && !route.isSubNavParent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {route.icon && <route.icon className="h-3.5 w-3.5 shrink-0" />}
                <Trans>{route.label}</Trans>
              </NavLink>
            ))}
        </div>

        <div className="col-span-12 md:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
