import React from 'react';

import { Trans } from '@lingui/react/macro';
import {
  BarChart3,
  Building2Icon,
  FileStack,
  Settings,
  Trophy,
  Users,
  Wallet2,
} from 'lucide-react';
import { Link, Outlet, redirect, useLocation } from 'react-router';

import { getSession } from '@signtusk/auth/server/lib/utils/get-session';
import { isAdmin } from '@signtusk/lib/utils/is-admin';
import { cn } from '@signtusk/ui/lib/utils';

import type { Route } from './+types/_layout';

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getSession(request);

  if (!user || !isAdmin(user)) {
    throw redirect('/');
  }
}

const navItem = (
  path: string,
  label: React.ReactNode,
  Icon: React.ComponentType<{ className?: string }>,
  pathname: string,
) => (
  <Link
    key={path}
    to={path}
    className={cn(
      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
      pathname?.startsWith(path)
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
    )}
  >
    <Icon className="h-4 w-4 shrink-0" />
    {label}
  </Link>
);

export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
      <div className="mb-6 border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Trans>Admin Panel</Trans>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          <Trans>Instance management and monitoring.</Trans>
        </p>
      </div>

      <div className="grid grid-cols-12 gap-x-8">
        {/* Desktop nav */}
        <div className="hidden md:col-span-3 md:flex md:flex-col md:gap-1">
          {navItem('/admin/stats', <Trans>Stats</Trans>, BarChart3, pathname)}
          {navItem('/admin/organisations', <Trans>Organisations</Trans>, Building2Icon, pathname)}
          {navItem('/admin/claims', <Trans>Claims</Trans>, Wallet2, pathname)}
          {navItem('/admin/users', <Trans>Users</Trans>, Users, pathname)}
          {navItem('/admin/documents', <Trans>Documents</Trans>, FileStack, pathname)}
          {navItem('/admin/organisation-insights', <Trans>Organisation Insights</Trans>, Trophy, pathname)}
          {navItem('/admin/site-settings', <Trans>Site Settings</Trans>, Settings, pathname)}
        </div>

        {/* Mobile nav */}
        <div className="col-span-12 mb-6 flex flex-wrap gap-2 md:hidden">
          {[
            { path: '/admin/stats', label: <Trans>Stats</Trans>, Icon: BarChart3 },
            { path: '/admin/organisations', label: <Trans>Organisations</Trans>, Icon: Building2Icon },
            { path: '/admin/claims', label: <Trans>Claims</Trans>, Icon: Wallet2 },
            { path: '/admin/users', label: <Trans>Users</Trans>, Icon: Users },
            { path: '/admin/documents', label: <Trans>Documents</Trans>, Icon: FileStack },
            { path: '/admin/organisation-insights', label: <Trans>Insights</Trans>, Icon: Trophy },
            { path: '/admin/site-settings', label: <Trans>Settings</Trans>, Icon: Settings },
          ].map(({ path, label, Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                pathname?.startsWith(path)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        <div className="col-span-12 md:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
