import { useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { ReadStatus } from '@signtusk/lib/constants/prisma-enums';
import { Link } from 'react-router';

import LogoImage from '@signtusk/assets/logo.png';
import { authClient } from '@signtusk/auth/client';
import { useSession } from '@signtusk/lib/client-only/providers/session';
import { isPersonalLayout } from '@signtusk/lib/utils/organisations';
import { trpc } from '@signtusk/trpc/react';
import { Sheet, SheetContent } from '@signtusk/ui/primitives/sheet';
import { ThemeSwitcher } from '@signtusk/ui/primitives/theme-switcher';

import { useOptionalCurrentTeam } from '~/providers/team';

export type AppNavMobileProps = {
  isMenuOpen: boolean;
  onMenuOpenChange?: (_value: boolean) => void;
};

export const AppNavMobile = ({ isMenuOpen, onMenuOpenChange }: AppNavMobileProps) => {
  const { t } = useLingui();

  const { organisations } = useSession();

  const currentTeam = useOptionalCurrentTeam();

  const { data: unreadCountData } = trpc.document.inbox.getCount.useQuery(
    {
      readStatus: ReadStatus.NOT_OPENED,
    },
    {
      // refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  const handleMenuItemClick = () => {
    onMenuOpenChange?.(false);
  };

  const menuNavigationLinks = useMemo(() => {
    let teamUrl = currentTeam?.url || null;

    if (!teamUrl && isPersonalLayout(organisations)) {
      teamUrl = organisations[0].teams[0]?.url || null;
    }

    if (!teamUrl) {
      return [
        {
          href: '/inbox',
          text: t`Inbox`,
        },
        {
          href: '/settings/profile',
          text: t`Settings`,
        },
      ];
    }

    return [
      {
        href: `/t/${teamUrl}/documents`,
        text: t`Documents`,
      },
      {
        href: `/t/${teamUrl}/templates`,
        text: t`Templates`,
      },
      {
        href: '/inbox',
        text: t`Inbox`,
      },
      {
        href: '/settings/profile',
        text: t`Settings`,
      },
    ];
  }, [currentTeam, organisations]);

  return (
    <Sheet open={isMenuOpen} onOpenChange={onMenuOpenChange}>
      <SheetContent className="flex w-full max-w-[320px] flex-col gap-0 p-0">
        <div className="border-b px-5 py-4">
          <Link to="/" onClick={handleMenuItemClick}>
            <img
              src={LogoImage}
              alt="Signtusk Logo"
              className="dark:invert"
              width={140}
              height={20}
            />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-y-1 overflow-y-auto px-3 py-4">
          {menuNavigationLinks.map(({ href, text }) => (
            <Link
              key={href}
              className="text-foreground hover:bg-accent flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              to={href}
              onClick={() => handleMenuItemClick()}
            >
              <span>{text}</span>
              {href === '/inbox' && unreadCountData && unreadCountData.count > 0 && (
                <span className="bg-primary text-primary-foreground flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums">
                  {unreadCountData.count > 99 ? '99+' : unreadCountData.count}
                </span>
              )}
            </Link>
          ))}

          <button
            className="text-destructive hover:bg-destructive/10 mt-2 flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            onClick={async () => authClient.signOut()}
          >
            <Trans>Sign Out</Trans>
          </button>
        </nav>

        <div className="border-t px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Signtusk, Inc.
            </p>
            <ThemeSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
