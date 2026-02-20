import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import {
  File,
  FileCheck,
  FileClock,
  FileCog,
  FileEdit,
  Mail,
  MailOpen,
  PenTool,
  UserPlus,
  UserSquare2,
  Users,
} from 'lucide-react';

import { getDocumentStats } from '@signtusk/lib/server-only/admin/get-documents-stats';
import { getRecipientsStats } from '@signtusk/lib/server-only/admin/get-recipients-stats';
import {
  getMonthlyActiveUsers,
  getOrganisationsWithSubscriptionsCount,
  getUserWithSignedDocumentMonthlyGrowth,
  getUsersCount,
} from '@signtusk/lib/server-only/admin/get-users-stats';
import { getSignerConversionMonthly } from '@signtusk/lib/server-only/user/get-signer-conversion';

import { MonthlyActiveUsersChart } from '~/components/general/admin-monthly-active-user-charts';
import { AdminStatsSignerConversionChart } from '~/components/general/admin-stats-signer-conversion-chart';
import { AdminStatsUsersWithDocumentsChart } from '~/components/general/admin-stats-users-with-documents';
import { CardMetric } from '~/components/general/metric-card';

import { version } from '../../../../package.json';
import type { Route } from './+types/stats';

export async function loader() {
  const [
    usersCount,
    organisationsWithSubscriptionsCount,
    docStats,
    recipientStats,
    signerConversionMonthly,
    monthlyUsersWithDocuments,
    monthlyActiveUsers,
  ] = await Promise.all([
    getUsersCount(),
    getOrganisationsWithSubscriptionsCount(),
    getDocumentStats(),
    getRecipientsStats(),
    getSignerConversionMonthly(),
    getUserWithSignedDocumentMonthlyGrowth(),
    getMonthlyActiveUsers(),
  ]);

  return {
    usersCount,
    organisationsWithSubscriptionsCount,
    docStats,
    recipientStats,
    signerConversionMonthly,
    monthlyUsersWithDocuments,
    monthlyActiveUsers,
  };
}

export default function AdminStatsPage({ loaderData }: Route.ComponentProps) {
  const { _ } = useLingui();

  const {
    usersCount,
    organisationsWithSubscriptionsCount,
    docStats,
    recipientStats,
    signerConversionMonthly,
    monthlyUsersWithDocuments,
    monthlyActiveUsers,
  } = loaderData;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">
          <Trans>Instance Stats</Trans>
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          <Trans>Overview of your instance usage and performance.</Trans>
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardMetric icon={Users} title={_(msg`Total Users`)} value={usersCount} />
        <CardMetric icon={File} title={_(msg`Total Documents`)} value={docStats.ALL} />
        <CardMetric
          icon={UserPlus}
          title={_(msg`Active Subscriptions`)}
          value={organisationsWithSubscriptionsCount}
        />
        <CardMetric icon={FileCog} title={_(msg`App Version`)} value={`v${version}`} />
      </div>

      <div className="mt-10 space-y-8">
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trans>Document metrics</Trans>
          </h3>
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <CardMetric icon={FileEdit} title={_(msg`Drafted Documents`)} value={docStats.DRAFT} />
            <CardMetric
              icon={FileClock}
              title={_(msg`Pending Documents`)}
              value={docStats.PENDING}
            />
            <CardMetric
              icon={FileCheck}
              title={_(msg`Completed Documents`)}
              value={docStats.COMPLETED}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trans>Recipients metrics</Trans>
          </h3>
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <CardMetric
              icon={UserSquare2}
              title={_(msg`Total Recipients`)}
              value={recipientStats.TOTAL_RECIPIENTS}
            />
            <CardMetric
              icon={Mail}
              title={_(msg`Documents Received`)}
              value={recipientStats.SENT}
            />
            <CardMetric
              icon={MailOpen}
              title={_(msg`Documents Viewed`)}
              value={recipientStats.OPENED}
            />
            <CardMetric
              icon={PenTool}
              title={_(msg`Signatures Collected`)}
              value={recipientStats.SIGNED}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Trans>Charts</Trans>
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <MonthlyActiveUsersChart title={_(msg`MAU (signed in)`)} data={monthlyActiveUsers} />

          <AdminStatsUsersWithDocumentsChart
            data={monthlyUsersWithDocuments}
            title={_(msg`MAU (created document)`)}
            tooltip={_(msg`Monthly Active Users: Users that created at least one Document`)}
          />
          <AdminStatsUsersWithDocumentsChart
            data={monthlyUsersWithDocuments}
            completed
            title={_(msg`MAU (had document completed)`)}
            tooltip={_(
              msg`Monthly Active Users: Users that had at least one of their documents completed`,
            )}
          />
          <AdminStatsSignerConversionChart
            title="Signers that Signed Up"
            data={signerConversionMonthly}
          />
          <AdminStatsSignerConversionChart
            title={_(msg`Total Signers that Signed Up`)}
            data={signerConversionMonthly}
            cummulative
          />
        </div>
      </div>
    </div>
  );
}
