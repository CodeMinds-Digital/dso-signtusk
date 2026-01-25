-- CreateEnum
CREATE TYPE "SSOProvider" AS ENUM ('SAML2', 'OIDC');

-- CreateEnum
CREATE TYPE "SSOConfigStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "SSOAuditEventType" AS ENUM ('CONFIG_CREATED', 'CONFIG_UPDATED', 'CONFIG_DELETED', 'CONFIG_ACTIVATED', 'CONFIG_DEACTIVATED', 'LOGIN_INITIATED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT_INITIATED', 'LOGOUT_SUCCESS', 'USER_PROVISIONED', 'USER_UPDATED', 'ASSERTION_RECEIVED', 'TOKEN_RECEIVED');

-- AlterTable
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN     "attributeMapping" JSONB,
ADD COLUMN     "jitProvisioning" JSONB,
ADD COLUMN     "oidcClockTolerance" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "oidcScopes" TEXT[] DEFAULT ARRAY['openid', 'email', 'profile']::TEXT[],
ADD COLUMN     "oidcValidateIssuer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "samlAcsUrl" TEXT,
ADD COLUMN     "samlCertificate" TEXT,
ADD COLUMN     "samlEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "samlEntityId" TEXT,
ADD COLUMN     "samlPrivateKey" TEXT,
ADD COLUMN     "samlSloUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "ssoConfigId" TEXT,
ADD COLUMN     "ssoProvisioned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "SSOConfiguration" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" "SSOProvider" NOT NULL,
    "domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "SSOConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "config" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "organisationAuthenticationPortalId" TEXT NOT NULL,

    CONSTRAINT "SSOConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOSession" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ssoConfigId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "SSOProvider" NOT NULL,
    "sessionIndex" TEXT,
    "nameID" TEXT,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSOSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOAuditEvent" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ssoConfigId" TEXT,
    "userId" INTEGER,
    "event" "SSOAuditEventType" NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSOAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SSOConfiguration_organisationId_idx" ON "SSOConfiguration"("organisationId");

-- CreateIndex
CREATE INDEX "SSOConfiguration_domains_idx" ON "SSOConfiguration"("domains");

-- CreateIndex
CREATE INDEX "SSOConfiguration_status_idx" ON "SSOConfiguration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SSOConfiguration_organisationId_name_key" ON "SSOConfiguration"("organisationId", "name");

-- CreateIndex
CREATE INDEX "SSOSession_organisationId_idx" ON "SSOSession"("organisationId");

-- CreateIndex
CREATE INDEX "SSOSession_userId_idx" ON "SSOSession"("userId");

-- CreateIndex
CREATE INDEX "SSOSession_ssoConfigId_idx" ON "SSOSession"("ssoConfigId");

-- CreateIndex
CREATE INDEX "SSOSession_expiresAt_idx" ON "SSOSession"("expiresAt");

-- CreateIndex
CREATE INDEX "SSOAuditEvent_organisationId_idx" ON "SSOAuditEvent"("organisationId");

-- CreateIndex
CREATE INDEX "SSOAuditEvent_timestamp_idx" ON "SSOAuditEvent"("timestamp");

-- CreateIndex
CREATE INDEX "SSOAuditEvent_event_idx" ON "SSOAuditEvent"("event");

-- CreateIndex
CREATE INDEX "SSOAuditEvent_userId_idx" ON "SSOAuditEvent"("userId");

-- AddForeignKey
ALTER TABLE "SSOConfiguration" ADD CONSTRAINT "SSOConfiguration_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOConfiguration" ADD CONSTRAINT "SSOConfiguration_organisationAuthenticationPortalId_fkey" FOREIGN KEY ("organisationAuthenticationPortalId") REFERENCES "OrganisationAuthenticationPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOSession" ADD CONSTRAINT "SSOSession_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOSession" ADD CONSTRAINT "SSOSession_ssoConfigId_fkey" FOREIGN KEY ("ssoConfigId") REFERENCES "SSOConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOSession" ADD CONSTRAINT "SSOSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOAuditEvent" ADD CONSTRAINT "SSOAuditEvent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOAuditEvent" ADD CONSTRAINT "SSOAuditEvent_ssoConfigId_fkey" FOREIGN KEY ("ssoConfigId") REFERENCES "SSOConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOAuditEvent" ADD CONSTRAINT "SSOAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
