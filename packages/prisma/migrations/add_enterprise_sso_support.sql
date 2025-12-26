-- Migration: Add Enterprise SSO Support
-- This migration adds comprehensive SSO support including SAML 2.0 and enhanced OIDC

-- Add new enums for SSO support
CREATE TYPE "SSOProvider" AS ENUM ('SAML2', 'OIDC');
CREATE TYPE "SSOConfigStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ERROR');
CREATE TYPE "SSOAuditEventType" AS ENUM (
  'CONFIG_CREATED',
  'CONFIG_UPDATED', 
  'CONFIG_DELETED',
  'CONFIG_ACTIVATED',
  'CONFIG_DEACTIVATED',
  'LOGIN_INITIATED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT_INITIATED',
  'LOGOUT_SUCCESS',
  'USER_PROVISIONED',
  'USER_UPDATED',
  'ASSERTION_RECEIVED',
  'TOKEN_RECEIVED'
);

-- Create SSOConfiguration table
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

    CONSTRAINT "SSOConfiguration_pkey" PRIMARY KEY ("id")
);

-- Create SSOSession table
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

-- Create SSOAuditEvent table
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

-- Extend OrganisationAuthenticationPortal with SSO fields
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "jitProvisioning" JSONB;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "attributeMapping" JSONB;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "samlEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "samlEntityId" TEXT;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "samlAcsUrl" TEXT;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "samlSloUrl" TEXT;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "samlCertificate" TEXT;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "samlPrivateKey" TEXT;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "oidcScopes" TEXT[] DEFAULT ARRAY['openid', 'email', 'profile']::TEXT[];
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "oidcValidateIssuer" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OrganisationAuthenticationPortal" ADD COLUMN "oidcClockTolerance" INTEGER NOT NULL DEFAULT 60;

-- Extend User table with SSO fields
ALTER TABLE "User" ADD COLUMN "ssoProvisioned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "ssoConfigId" TEXT;
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "department" TEXT;
ALTER TABLE "User" ADD COLUMN "title" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Create indexes for performance
CREATE INDEX "SSOConfiguration_organisationId_idx" ON "SSOConfiguration"("organisationId");
CREATE INDEX "SSOConfiguration_domains_idx" ON "SSOConfiguration" USING GIN("domains");
CREATE INDEX "SSOConfiguration_status_idx" ON "SSOConfiguration"("status");

CREATE INDEX "SSOSession_organisationId_idx" ON "SSOSession"("organisationId");
CREATE INDEX "SSOSession_userId_idx" ON "SSOSession"("userId");
CREATE INDEX "SSOSession_ssoConfigId_idx" ON "SSOSession"("ssoConfigId");
CREATE INDEX "SSOSession_expiresAt_idx" ON "SSOSession"("expiresAt");

CREATE INDEX "SSOAuditEvent_organisationId_idx" ON "SSOAuditEvent"("organisationId");
CREATE INDEX "SSOAuditEvent_timestamp_idx" ON "SSOAuditEvent"("timestamp");
CREATE INDEX "SSOAuditEvent_event_idx" ON "SSOAuditEvent"("event");
CREATE INDEX "SSOAuditEvent_userId_idx" ON "SSOAuditEvent"("userId");

-- Add foreign key constraints
ALTER TABLE "SSOConfiguration" ADD CONSTRAINT "SSOConfiguration_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SSOSession" ADD CONSTRAINT "SSOSession_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SSOSession" ADD CONSTRAINT "SSOSession_ssoConfigId_fkey" FOREIGN KEY ("ssoConfigId") REFERENCES "SSOConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SSOSession" ADD CONSTRAINT "SSOSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SSOAuditEvent" ADD CONSTRAINT "SSOAuditEvent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SSOAuditEvent" ADD CONSTRAINT "SSOAuditEvent_ssoConfigId_fkey" FOREIGN KEY ("ssoConfigId") REFERENCES "SSOConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SSOAuditEvent" ADD CONSTRAINT "SSOAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraints
ALTER TABLE "SSOConfiguration" ADD CONSTRAINT "SSOConfiguration_organisationId_name_key" UNIQUE ("organisationId", "name");

-- Add check constraints
ALTER TABLE "SSOConfiguration" ADD CONSTRAINT "SSOConfiguration_domains_not_empty" CHECK (array_length("domains", 1) > 0);