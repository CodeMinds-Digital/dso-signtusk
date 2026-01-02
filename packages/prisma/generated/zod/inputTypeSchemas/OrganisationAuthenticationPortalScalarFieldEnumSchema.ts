import { z } from 'zod';

export const OrganisationAuthenticationPortalScalarFieldEnumSchema = z.enum(['id','enabled','clientId','clientSecret','wellKnownUrl','defaultOrganisationRole','autoProvisionUsers','allowedDomains','jitProvisioning','attributeMapping','samlEnabled','samlEntityId','samlAcsUrl','samlSloUrl','samlCertificate','samlPrivateKey','oidcScopes','oidcValidateIssuer','oidcClockTolerance']);

export default OrganisationAuthenticationPortalScalarFieldEnumSchema;
