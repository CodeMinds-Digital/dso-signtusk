import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { MenuIcon, SearchIcon } from 'lucide-react';
import { Link, Outlet, redirect } from 'react-router';

import { getOptionalSession } from '@signtusk/auth/server/lib/utils/get-session';
import { OrganisationProvider } from '@signtusk/lib/client-only/providers/organisation';
import { useSession } from '@signtusk/lib/client-only/providers/session';
import { isPersonalLayout } from '@signtusk/lib/utils/organisations';
import { getSiteSettings } from '@signtusk/lib/server-only/site-settings/get-site-settings';
import { SITE_SETTINGS_BANNER_ID } from '@signtusk/lib/server-only/site-settings/schemas/banner';
import { Button } from '@signtusk/ui/primitives/button';

import { AppBanner } from '~/components/general/app-banner';
import { AppCommandMenu } from '~/components/general/app-command-menu';
import { AppNavMobile } from '~/components/general/app-nav-mobile';
import { AppSidebar } from '~/components/general/app-sidebar';
import { GenericErrorLayout } from '~/components/general/generic-error-layout';
import { MenuSwitcher } from '~/components/general/menu-switcher';
import { OrgMenuSwitcher } from '~/components/general/org-menu-switcher';
import { OrganisationBillingBanner } from '~/components/general/organisations/organisation-billing-banner';
import { VerifyEmailBanner } from '~/components/general/verify-email-banner';
import { TeamProvider } from '~/providers/team';

import type { Route } from './+types/_layout';

/**
 * Don't revalidate (run the loader on sequential navigations)
 *
 * Update values via providers.
 */
export const shouldRevalidate = () => false;

export async function loader({ request }: Route.LoaderArgs) {
  const [session, banner] = await Promise.all([
    getOptionalSession(request),
    getSiteSettings().then((settings) =>
      settings.find((setting) => setting.id === SITE_SETTINGS_BANNER_ID),
    ),
  ]);

  if (!session.isAuthenticated) {
    throw redirect('/signin');
  }

  return {
    banner,
  };
}

export default function Layout({ loaderData, params, matches }: Route.ComponentProps) {
  const { banner } = loaderData;

  const { user, organisations } = useSession();

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const teamUrl = params.teamUrl;
  const orgUrl = params.orgUrl;

  const teams = organisations.flatMap((org) => org.teams);

  const extractCurrentOrganisation = () => {
    if (orgUrl) {
      return organisations.find((org) => org.url === orgUrl);
    }

    if (teamUrl) {
      return organisations.find((org) => org.teams.some((team) => team.url === teamUrl));
    }

    return null;
  };

  const currentTeam = teams.find((team) => team.url === teamUrl);
  const currentOrganisation = extractCurrentOrganisation() || null;

  const orgNotFound = params.orgUrl && !currentOrganisation;
  const teamNotFound = params.teamUrl && !currentTeam;

  // Hide the full shell for editor routes.
  const hideShell = matches.some(
    (match) =>
      match?.id === 'routes/_authenticated+/t.$teamUrl+/documents.$id.edit' ||
      match?.id === 'routes/_authenticated+/t.$teamUrl+/templates.$id.edit',
  );

  if (orgNotFound || teamNotFound) {
    return (
      <GenericErrorLayout
        errorCode={404}
        errorCodeMap={{
          404: orgNotFound
            ? {
                heading: msg`Organisation not found`,
                subHeading: msg`404 Organisation not found`,
                message: msg`The organisation you are looking for may have been removed, renamed or may have never existed.`,
              }
            : {
                heading: msg`Team not found`,
                subHeading: msg`404 Team not found`,
                message: msg`The team you are looking for may have been removed, renamed or may have never existed.`,
              },
        }}
        primaryButton={
          <Button asChild>
            <Link to="/">
              <Trans>Go home</Trans>
            </Link>
          </Button>
        }
      />
    );
  }

  if (hideShell) {
    return (
      <OrganisationProvider organisation={currentOrganisation}>
        <TeamProvider team={currentTeam || null}>
          <Outlet />
        </TeamProvider>
      </OrganisationProvider>
    );
  }

  return (
    <OrganisationProvider organisation={currentOrganisation}>
      <TeamProvider team={currentTeam || null}>
        <div className="flex h-screen overflow-hidden">
          {/* Desktop sidebar — hidden on mobile */}
          <AppSidebar onCommandMenuOpen={() => setIsCommandMenuOpen(true)} />

          {/* Main content area */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <OrganisationBillingBanner />

            {!user.emailVerified && <VerifyEmailBanner email={user.email} />}

            {banner && <AppBanner banner={banner} />}

            {/* Mobile top bar — hidden on desktop */}
            <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Open menu"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              <div className="flex-1" />

              <button
                onClick={() => setIsCommandMenuOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Search"
              >
                <SearchIcon className="h-4 w-4" />
              </button>

              <div className="ml-1">
                {isPersonalLayout(organisations) ? <MenuSwitcher /> : <OrgMenuSwitcher />}
              </div>
            </header>

            {/* Scrollable main content */}
            <main className="page-enter flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>

        <AppCommandMenu open={isCommandMenuOpen} onOpenChange={setIsCommandMenuOpen} />

        <AppNavMobile
          isMenuOpen={isMobileMenuOpen}
          onMenuOpenChange={setIsMobileMenuOpen}
        />
      </TeamProvider>
    </OrganisationProvider>
  );
}
