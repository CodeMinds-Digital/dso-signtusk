import { type HTMLAttributes, useEffect, useState } from 'react';

import { ReadStatus } from '@signtusk/lib/constants/prisma-enums';
import { InboxIcon, MenuIcon, SearchIcon } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { useSession } from '@signtusk/lib/client-only/providers/session';
import { isPersonalLayout } from '@signtusk/lib/utils/organisations';
import { getRootHref } from '@signtusk/lib/utils/params';
import { trpc } from '@signtusk/trpc/react';
import { cn } from '@signtusk/ui/lib/utils';
import { Button } from '@signtusk/ui/primitives/button';

import { BrandingLogo } from '~/components/general/branding-logo';

import { AppCommandMenu } from './app-command-menu';
import { AppNavDesktop } from './app-nav-desktop';
import { AppNavMobile } from './app-nav-mobile';
import { MenuSwitcher } from './menu-switcher';
import { OrgMenuSwitcher } from './org-menu-switcher';

export type HeaderProps = HTMLAttributes<HTMLDivElement>;

export const Header = ({ className, ...props }: HeaderProps) => {
  const params = useParams();

  const { organisations } = useSession();

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { data: unreadCountData } = trpc.document.inbox.getCount.useQuery(
    {
      readStatus: ReadStatus.NOT_OPENED,
    },
    {
      // refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'supports-backdrop-blur:bg-background/80 bg-background/95 sticky top-0 z-[60] flex h-14 w-full items-center border-b border-b-transparent backdrop-blur-md transition-all duration-200',
        scrollY > 5 && 'border-b-border shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-x-3 px-4 md:justify-normal md:px-6">
        <Link
          to={getRootHref(params)}
          className="focus-visible:ring-ring ring-offset-background hidden shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:inline"
        >
          <BrandingLogo className="h-5 w-auto" />
        </Link>

        <AppNavDesktop setIsCommandMenuOpen={setIsCommandMenuOpen} />

        <Button
          asChild
          variant="ghost"
          className="relative hidden h-9 w-9 shrink-0 rounded-lg p-0 md:flex"
        >
          <Link to="/inbox" className="relative flex items-center justify-center">
            <InboxIcon className="text-muted-foreground hover:text-foreground h-4 w-4 transition-colors" />

            {unreadCountData && unreadCountData.count > 0 && (
              <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold tabular-nums">
                {unreadCountData.count > 99 ? '99+' : unreadCountData.count}
              </span>
            )}
          </Link>
        </Button>

        <div className="md:ml-2">
          {isPersonalLayout(organisations) ? <MenuSwitcher /> : <OrgMenuSwitcher />}
        </div>

        <div className="flex flex-row items-center gap-x-1 md:hidden">
          <button
            onClick={() => setIsCommandMenuOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            aria-label="Search"
          >
            <SearchIcon className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsHamburgerMenuOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            aria-label="Open menu"
          >
            <MenuIcon className="h-4 w-4" />
          </button>

          <AppCommandMenu open={isCommandMenuOpen} onOpenChange={setIsCommandMenuOpen} />

          <AppNavMobile
            isMenuOpen={isHamburgerMenuOpen}
            onMenuOpenChange={setIsHamburgerMenuOpen}
          />
        </div>
      </div>
    </header>
  );
};
