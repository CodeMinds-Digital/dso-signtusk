import type { HTMLAttributes } from 'react';

import { Trans } from '@lingui/react/macro';
import {
  BracesIcon,
  CreditCardIcon,
  Globe2Icon,
  Lock,
  MailIcon,
  PaletteIcon,
  Settings2Icon,
  User,
  Users,
  WebhookIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { useSession } from '@signtusk/lib/client-only/providers/session';
import { IS_BILLING_ENABLED } from '@signtusk/lib/constants/app';
import { canExecuteOrganisationAction, isPersonalLayout } from '@signtusk/lib/utils/organisations';
import { cn } from '@signtusk/ui/lib/utils';

export type SettingsMobileNavProps = HTMLAttributes<HTMLDivElement>;

export const SettingsMobileNav = ({ className, ...props }: SettingsMobileNavProps) => {
  const { pathname } = useLocation();

  const { organisations } = useSession();

  const isPersonalLayoutMode = isPersonalLayout(organisations);

  const hasManageableBillingOrgs = organisations.some((org) =>
    canExecuteOrganisationAction('MANAGE_BILLING', org.currentOrganisationRole),
  );

  const navChip = (href: string, icon: React.ReactNode, label: React.ReactNode) => {
    const isActive = pathname?.startsWith(href);
    return (
      <Link
        key={href}
        to={href}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap',
          isActive
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
      {navChip('/settings/profile', <User className="h-3.5 w-3.5" />, <Trans>Profile</Trans>)}

      {isPersonalLayoutMode && (
        <>
          {navChip(
            '/settings/document',
            <Settings2Icon className="h-3.5 w-3.5" />,
            <Trans>Document Preferences</Trans>,
          )}

          {navChip(
            '/settings/branding',
            <PaletteIcon className="h-3.5 w-3.5" />,
            <Trans>Branding Preferences</Trans>,
          )}

          {navChip(
            '/settings/email',
            <MailIcon className="h-3.5 w-3.5" />,
            <Trans>Email Preferences</Trans>,
          )}

          {navChip(
            '/settings/public-profile',
            <Globe2Icon className="h-3.5 w-3.5" />,
            <Trans>Public Profile</Trans>,
          )}

          {navChip(
            '/settings/tokens',
            <BracesIcon className="h-3.5 w-3.5" />,
            <Trans>API Tokens</Trans>,
          )}

          {navChip(
            '/settings/webhooks',
            <WebhookIcon className="h-3.5 w-3.5" />,
            <Trans>Webhooks</Trans>,
          )}
        </>
      )}

      {navChip(
        '/settings/organisations',
        <Users className="h-3.5 w-3.5" />,
        <Trans>Organisations</Trans>,
      )}

      {IS_BILLING_ENABLED() &&
        hasManageableBillingOrgs &&
        navChip(
          isPersonalLayoutMode ? '/settings/billing-personal' : '/settings/billing',
          <CreditCardIcon className="h-3.5 w-3.5" />,
          <Trans>Billing</Trans>,
        )}

      {navChip(
        '/settings/security',
        <Lock className="h-3.5 w-3.5" />,
        <Trans>Security</Trans>,
      )}
    </div>
  );
};
