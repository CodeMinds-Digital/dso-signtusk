import { Trans } from '@lingui/react/macro';
import { Outlet } from 'react-router';

import { SettingsDesktopNav } from '~/components/general/settings-nav-desktop';
import { SettingsMobileNav } from '~/components/general/settings-nav-mobile';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Settings');
}

export default function SettingsLayout() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
      <div className="mb-6 border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Trans>Settings</Trans>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          <Trans>Manage your account preferences and settings.</Trans>
        </p>
      </div>

      <div className="grid grid-cols-12 gap-x-8">
        <SettingsDesktopNav className="hidden md:col-span-3 md:flex" />
        <SettingsMobileNav className="col-span-12 mb-8 md:hidden" />

        <div className="col-span-12 md:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
