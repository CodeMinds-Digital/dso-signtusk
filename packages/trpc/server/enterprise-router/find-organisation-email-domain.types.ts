import { EmailDomainStatus } from '@signtusk/lib/constants/prisma-enums';
import { z } from 'zod';

import { ZEmailDomainManySchema } from '@signtusk/lib/types/email-domain';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@signtusk/lib/types/search-params';

export const ZFindOrganisationEmailDomainsRequestSchema = ZFindSearchParamsSchema.extend({
  organisationId: z.string(),
  emailDomainId: z.string().optional(),
  statuses: z.nativeEnum(EmailDomainStatus).array().optional(),
});

export const ZFindOrganisationEmailDomainsResponseSchema = ZFindResultResponse.extend({
  data: z.array(
    ZEmailDomainManySchema.extend({
      emailCount: z.number(),
    }),
  ),
});

export type TFindOrganisationEmailDomainsResponse = z.infer<
  typeof ZFindOrganisationEmailDomainsResponseSchema
>;
