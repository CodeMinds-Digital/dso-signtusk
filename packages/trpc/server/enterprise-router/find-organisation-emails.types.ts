import { z } from 'zod';

import { ZOrganisationEmailManySchema } from '@signtusk/lib/types/organisation-email';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@signtusk/lib/types/search-params';

export const ZFindOrganisationEmailsRequestSchema = ZFindSearchParamsSchema.extend({
  organisationId: z.string(),
  emailDomainId: z.string().optional(),
});

export const ZFindOrganisationEmailsResponseSchema = ZFindResultResponse.extend({
  data: ZOrganisationEmailManySchema.array(),
});

export type TFindOrganisationEmailsResponse = z.infer<typeof ZFindOrganisationEmailsResponseSchema>;
