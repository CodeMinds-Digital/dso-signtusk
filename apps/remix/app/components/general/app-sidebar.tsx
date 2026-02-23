import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { ReadStatus } from '@signtusk/lib/constants/prisma-enums';
import {
  FileTextIcon,
  InboxIcon,
  LayoutTemplateIcon,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';

import { authClient } from '@signtusk/auth/client';
import { useSession } from '@signtusk/lib/client-only/providers/session';
import { formatAvatarUrl } from '@signtusk/lib/utils/avatars';
import { isPersonalLayout } from '@signtusk/lib/utils/organisations';
import { getRootHref } from '@signtusk/lib/utils/params';
import { extractInitials } from '@signtusk/lib/utils/recipient-formatter';
import { trpc } from '@signtusk/trpc/react';
import { cn } from '@signtusk/ui/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@signtusk/ui/primitives/avatar';
import { ThemeSwitcher } from '@signtusk/ui/primitives/theme-switcher';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@signtusk/ui/primitives/tooltip';

import { BrandingLogoIcon } from '~/components/general/branding-logo';
import { useOptionalCurrentTeam } from '~/providers/team';

export type AppSidebarProps = {
  onCommandMenuOpen?: () => void;
};

export const AppSidebar = ({ onCommandMenuOpen }: AppSidebarProps) => {
  const { _ } = useLingui();
  const params = useParams();
  const { pathname } = useLocation();
  const { user, organisations } = useSession();
  const currentTeam = useOptionalCurrentTeam();

  const { data: unreadCountData } = trpc.document.inbox.getCount.useQuery({
    readStatus: ReadStatus.NOT_OPENED,
  });

  const teamUrl = (() => {
    let url = currentTeam?.url || null;
    if (!url && isPersonalLayout(organisations)) {
      url = organisations[0]?.teams[0]?.url || null;
    }
    return url;
  })();

  const unreadCount = unreadCountData?.count ?? 0;

  const avatarFallback = user.name
    ? extractInitials(user.name)
    : user.email.slice(0, 1).toUpperCase();

  const navItems = teamUrl
    ? [
        {
          href: `/t/${teamUrl}/documents`,
          icon: FileTextIcon,
          label: msg`Documents`,
        },
        {
          href: `/t/${teamUrl}/templates`,
          icon: LayoutTemplateIcon,
          label: msg`Templates`,
        },
      ]
    : [];

  const NavItem = ({
    href,
    icon: Icon,
    label,
    badge,
  }: {
    href: string;
    icon: React.ElementType;
    label: ReturnType<typeof msg>;
    badge?: number;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={href}
            className={cn(
              'group relative flex h-10 w-full items-center justify-center rounded-r-md transition-colors',
              isActive
                ? 'border-l-2 border-primary bg-primary/5 text-primary'
                : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {badge != null && badge > 0 && (
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {_(label)}
          {badge != null && badge > 0 && ` (${badge})`}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="hidden w-16 flex-shrink-0 flex-col border-r border-border bg-background md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={getRootHref(params)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted/50"
              >
                <BrandingLogoIcon className="h-7 w-7" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Home
            </TooltipContent>
          </Tooltip>
        </div>

        {/* New Document */}
        {teamUrl && (
          <div className="flex justify-center py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/t/${teamUrl}/documents/new`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <PlusIcon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                New Document
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Search */}
        <div className="flex justify-center pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCommandMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <SearchIcon className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Search (⌘K)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          {/* Workspace items */}
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavItem {...item} />
              </li>
            ))}
            <li>
              <NavItem
                href="/inbox"
                icon={InboxIcon}
                label={msg`Inbox`}
                badge={unreadCount}
              />
            </li>
          </ul>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Settings */}
          <ul className="border-t border-border py-2">
            <li>
              <NavItem
                href="/settings/profile"
                icon={SettingsIcon}
                label={msg`Settings`}
              />
            </li>
          </ul>

          {/* Footer */}
          <div className="flex flex-col items-center gap-2 border-t border-border py-3">
            <ThemeSwitcher />

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings/profile"
                  className="flex items-center justify-center"
                >
                  <Avatar className="h-7 w-7 border border-border">
                    <AvatarImage src={formatAvatarUrl(user.avatarImageId)} />
                    <AvatarFallback className="text-[10px]">{avatarFallback}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {user.name || user.email}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={async () => authClient.signOut()}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
                >
                  <LogOutIcon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Sign out
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
};
