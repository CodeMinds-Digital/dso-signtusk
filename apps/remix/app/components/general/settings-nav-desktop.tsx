import type { HTMLAttributes } from 'react';

import { Trans } from '@lingui/react/macro';
import {
  BracesIcon,
  CreditCardIcon,
  Globe2Icon,
  Lock,
  Settings2Icon,
  User,
  Users,
  WebhookIcon,
} from 'lucide-react';
import { useLocation } from 'react-router';
import { Link } from 'react-router';

import { useSession } from '@signtusk/lib/client-only/providers/session';
import { IS_BILLING_ENABLED } from '@signtusk/lib/constants/app';
import { canExecuteOrganisationAction, isPersonalLayout } from '@signtusk/lib/utils/organisations';
import { cn } from '@signtusk/ui/lib/utils';

export type SettingsDesktopNavProps = HTMLAttributes<HTMLDivElement>;

export const SettingsDesktopNav = ({ className, ...props }: SettingsDesktopNavProps) => {
  const { pathname } = useLocation();

  const { organisations } = useSession();

  const isPersonalLayoutMode = isPersonalLayout(organisations);

  const hasManageableBillingOrgs = organisations.some((org) =>
    canExecuteOrganisationAction('MANAGE_BILLING', org.currentOrganisationRole),
  );

  const navItem = (
    href: string,
    icon: React.ReactNode,
    label: React.ReactNode,
    indent = false,
  ) => {
    const isActive = pathname?.startsWith(href);
    return (
      <Link
        key={href}
        to={href}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
          indent && 'ml-6',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <nav className={cn('flex flex-col gap-y-0.5', className)} {...props}>
      {navItem(
        '/settings/profile',
        <User className="h-4 w-4 shrink-0" />,
        <Trans>Profile</Trans>,
      )}

      {isPersonalLayoutMode && (
        <>
          <div className="mt-3 mb-1 px-3">
            <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
              <Settings2Icon className="h-3 w-3" />
              <Trans>Preferences</Trans>
            </p>
          </div>

          {navItem('/settings/document', null, <Trans>Document</Trans>, true)}
          {navItem('/settings/branding', null, <Trans>Branding</Trans>, true)}
          {navItem('/settings/email', null, <Trans>Email</Trans>, true)}

          {navItem(
            '/settings/public-profile',
            <Globe2Icon className="h-4 w-4 shrink-0" />,
            <Trans>Public Profile</Trans>,
          )}

          {navItem(
            '/settings/tokens',
            <BracesIcon className="h-4 w-4 shrink-0" />,
            <Trans>API Tokens</Trans>,
          )}

          {navItem(
            '/settings/webhooks',
            <WebhookIcon className="h-4 w-4 shrink-0" />,
            <Trans>Webhooks</Trans>,
          )}
        </>
      )}

      <div className="mt-3 mb-1 px-3">
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
          <Trans>Account</Trans>
        </p>
      </div>

      {navItem(
        '/settings/organisations',
        <Users className="h-4 w-4 shrink-0" />,
        <Trans>Organisations</Trans>,
      )}

      {IS_BILLING_ENABLED() &&
        hasManageableBillingOrgs &&
        navItem(
          isPersonalLayoutMode ? '/settings/billing-personal' : '/settings/billing',
          <CreditCardIcon className="h-4 w-4 shrink-0" />,
          <Trans>Billing</Trans>,
        )}

      {navItem(
        '/settings/security',
        <Lock className="h-4 w-4 shrink-0" />,
        <Trans>Security</Trans>,
      )}
    </nav>
  );
};
