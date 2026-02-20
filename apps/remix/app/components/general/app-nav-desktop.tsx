import type { HTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { useSession } from '@signtusk/lib/client-only/providers/session';
import { isPersonalLayout } from '@signtusk/lib/utils/organisations';
import { cn } from '@signtusk/ui/lib/utils';
import { Button } from '@signtusk/ui/primitives/button';

import { useOptionalCurrentTeam } from '~/providers/team';

export type AppNavDesktopProps = HTMLAttributes<HTMLDivElement> & {
  setIsCommandMenuOpen: (value: boolean) => void;
};

export const AppNavDesktop = ({
  className,
  setIsCommandMenuOpen,
  ...props
}: AppNavDesktopProps) => {
  const { _ } = useLingui();
  const { organisations } = useSession();

  const { pathname } = useLocation();

  const [modifierKey, setModifierKey] = useState(() => 'Ctrl');

  const currentTeam = useOptionalCurrentTeam();

  useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const isMacOS = /Macintosh|Mac\s+OS\s+X/i.test(userAgent);

    setModifierKey(isMacOS ? '⌘' : 'Ctrl');
  }, []);

  const menuNavigationLinks = useMemo(() => {
    let teamUrl = currentTeam?.url || null;

    if (!teamUrl && isPersonalLayout(organisations)) {
      teamUrl = organisations[0].teams[0]?.url || null;
    }

    if (!teamUrl) {
      return [];
    }

    return [
      {
        href: `/t/${teamUrl}/documents`,
        label: msg`Documents`,
      },
      {
        href: `/t/${teamUrl}/templates`,
        label: msg`Templates`,
      },
    ];
  }, [currentTeam, organisations]);

  return (
    <div
      className={cn(
        'ml-6 hidden flex-1 items-center gap-x-8 md:flex md:justify-between',
        className,
      )}
      {...props}
    >
      <div>
        <AnimatePresence>
          {menuNavigationLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-x-1"
            >
              {menuNavigationLinks.map(({ href, label }) => {
                const isActive = pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    to={href}
                    className={cn(
                      'focus-visible:ring-ring ring-offset-background relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2',
                      isActive
                        ? 'text-foreground bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                    )}
                  >
                    {_(label)}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button
        variant="outline"
        className="text-muted-foreground hover:text-muted-foreground flex w-full max-w-72 items-center justify-between rounded-lg border-border/70 bg-muted/40 px-3 text-sm shadow-none hover:bg-muted/60"
        onClick={() => setIsCommandMenuOpen(true)}
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <Trans>Search...</Trans>
        </div>

        <kbd className="bg-background text-muted-foreground pointer-events-none hidden select-none items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium opacity-70 sm:flex">
          {modifierKey}K
        </kbd>
      </Button>
    </div>
  );
};
