import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Building2Icon,
  CreditCardIcon,
  GroupIcon,
  MailboxIcon,
  Settings2Icon,
  ShieldCheckIcon,
  Users2Icon,
} from 'lucide-react';
import { FaUsers } from 'react-icons/fa6';
import { Link, NavLink, Outlet } from 'react-router';

import { useCurrentOrganisation } from '@signtusk/lib/client-only/providers/organisation';
import { IS_BILLING_ENABLED } from '@signtusk/lib/constants/app';
import { canExecuteOrganisationAction } from '@signtusk/lib/utils/organisations';
import { Button } from '@signtusk/ui/primitives/button';
import { cn } from '@signtusk/ui/lib/utils';

import { GenericErrorLayout } from '~/components/general/generic-error-layout';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Organisation Settings');
}

export default function SettingsLayout() {
  const { t } = useLingui();

  const isBillingEnabled = IS_BILLING_ENABLED();
  const organisation = useCurrentOrganisation();

  const organisationSettingRoutes = [
    {
      path: `/o/${organisation.url}/settings/general`,
      label: t`General`,
      icon: Building2Icon,
    },
    {
      path: `/o/${organisation.url}/settings/document`,
      label: t`Preferences`,
      icon: Settings2Icon,
      hideHighlight: true,
    },
    {
      path: `/o/${organisation.url}/settings/document`,
      label: t`Document`,
      isSubNav: true,
    },
    {
      path: `/o/${organisation.url}/settings/branding`,
      label: t`Branding`,
      isSubNav: true,
    },
    {
      path: `/o/${organisation.url}/settings/email`,
      label: t`Email`,
      isSubNav: true,
    },
    {
      path: `/o/${organisation.url}/settings/email-domains`,
      label: t`Email Domains`,
      icon: MailboxIcon,
    },
    {
      path: `/o/${organisation.url}/settings/teams`,
      label: t`Teams`,
      icon: FaUsers,
    },
    {
      path: `/o/${organisation.url}/settings/members`,
      label: t`Members`,
      icon: Users2Icon,
    },
    {
      path: `/o/${organisation.url}/settings/groups`,
      label: t`Groups`,
      icon: GroupIcon,
    },
    {
      path: `/o/${organisation.url}/settings/sso`,
      label: t`SSO`,
      icon: ShieldCheckIcon,
    },
    {
      path: `/o/${organisation.url}/settings/billing`,
      label: t`Billing`,
      icon: CreditCardIcon,
    },
  ].filter((route) => {
    if (!isBillingEnabled && route.path.includes('/billing')) {
      return false;
    }

    if (
      (!isBillingEnabled || !organisation.organisationClaim.flags.emailDomains) &&
      route.path.includes('/email-domains')
    ) {
      return false;
    }

    if (
      (!isBillingEnabled || !organisation.organisationClaim.flags.authenticationPortal) &&
      route.path.includes('/sso')
    ) {
      return false;
    }

    return true;
  });

  if (!canExecuteOrganisationAction('MANAGE_ORGANISATION', organisation.currentOrganisationRole)) {
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
            <Link to={`/o/${organisation.url}`}>
              <Trans>Go Back</Trans>
            </Link>
          </Button>
        }
        secondaryButton={null}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Trans>Organisation Settings</Trans>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          <Trans>Manage your organisation preferences and members.</Trans>
        </p>
      </div>

      <div className="grid grid-cols-12 gap-x-8">
        {/* Navigation */}
        <div className="col-span-12 mb-6 hidden md:col-span-3 md:flex md:flex-col md:gap-1">
          {organisationSettingRoutes.map((route) => (
            <NavLink
              to={route.path}
              key={route.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  route.isSubNav && 'ml-4',
                  isActive && !route.hideHighlight
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
          {organisationSettingRoutes
            .filter((r) => !r.isSubNav)
            .map((route) => (
              <NavLink
                to={route.path}
                key={route.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                    isActive && !route.hideHighlight
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
