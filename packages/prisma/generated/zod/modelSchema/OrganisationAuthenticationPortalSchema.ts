import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { OrganisationMemberRoleSchema } from '../inputTypeSchemas/OrganisationMemberRoleSchema'

/////////////////////////////////////////
// ORGANISATION AUTHENTICATION PORTAL SCHEMA
/////////////////////////////////////////

export const OrganisationAuthenticationPortalSchema = z.object({
  defaultOrganisationRole: OrganisationMemberRoleSchema,
  id: z.string(),
  enabled: z.boolean(),
  clientId: z.string(),
  clientSecret: z.string(),
  wellKnownUrl: z.string(),
  autoProvisionUsers: z.boolean(),
  allowedDomains: z.string().array(),
  jitProvisioning: JsonValueSchema.nullable(),
  attributeMapping: JsonValueSchema.nullable(),
  samlEnabled: z.boolean(),
  samlEntityId: z.string().nullable(),
  samlAcsUrl: z.string().nullable(),
  samlSloUrl: z.string().nullable(),
  samlCertificate: z.string().nullable(),
  samlPrivateKey: z.string().nullable(),
  oidcScopes: z.string().array(),
  oidcValidateIssuer: z.boolean(),
  oidcClockTolerance: z.number(),
})

export type OrganisationAuthenticationPortal = z.infer<typeof OrganisationAuthenticationPortalSchema>

export default OrganisationAuthenticationPortalSchema;
