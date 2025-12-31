import { DateTime } from 'luxon';

import { kyselyPrisma, sql } from '@signtusk/prisma';

export const getSignerConversionMonthly = async () => {
  const qb = kyselyPrisma.$kysely
    .selectFrom('Recipient')
    .innerJoin('User', 'Recipient.email', 'User.email')
    .select(({ fn }: any) => [
      fn('DATE_TRUNC', [sql.lit('MONTH'), 'User.createdAt']).as('month'),
      fn.count('Recipient.email').distinct().as('count'),
      fn
        .sum(fn.count('Recipient.email').distinct())
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
        .over((ob: any) => ob.orderBy(fn('DATE_TRUNC', [sql.lit('MONTH'), 'User.createdAt']) as any))
        .as('cume_count'),
    ])
    .where('Recipient.signedAt', 'is not', null)
    .where('Recipient.signedAt', '<', (eb: any) => eb.ref('User.createdAt'))
    .groupBy(({ fn }: any) => fn('DATE_TRUNC', [sql.lit('MONTH'), 'User.createdAt']))
    .orderBy('month', 'desc');

  const result = await qb.execute();

  return result.map((row: any) => ({
    month: DateTime.fromJSDate(row.month).toFormat('yyyy-MM'),
    count: Number(row.count),
    cume_count: Number(row.cume_count),
  }));
};

export type GetSignerConversionMonthlyResult = Awaited<
  ReturnType<typeof getSignerConversionMonthly>
>;
