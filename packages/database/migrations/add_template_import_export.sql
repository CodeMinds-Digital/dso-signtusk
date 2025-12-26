-- Migration: Add Template Import/Export System
-- Description: Adds tables and enums for template import/export, migration, and backup functionality

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Template Export Format Enum
CREATE TYPE "TemplateExportFormat" AS ENUM (
  'JSON',
  'XML',
  'DOCUSIGN_TEMPLATE',
  'ADOBE_SIGN_TEMPLATE',
  'PANDADOC_TEMPLATE',
  'HELLOSIGN_TEMPLATE',
  'SIGNREQUEST_TEMPLATE',
  'BACKUP_ARCHIVE'
);

-- Import Status Enum
CREATE TYPE "ImportStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

-- Import Result Status Enum
CREATE TYPE "ImportResultStatus" AS ENUM (
  'IMPORTED',
  'SKIPPED',
  'FAILED'
);

-- Migration Source System Enum
CREATE TYPE "MigrationSourceSystem" AS ENUM (
  'DOCUSIGN',
  'ADOBE_SIGN',
  'PANDADOC',
  'HELLOSIGN',
  'SIGNREQUEST',
  'OTHER'
);

-- Migration Status Enum
CREATE TYPE "MigrationStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

-- Migration Result Status Enum
CREATE TYPE "MigrationResultStatus" AS ENUM (
  'MIGRATED',
  'SKIPPED',
  'FAILED'
);

-- Backup Status Enum
CREATE TYPE "BackupStatus" AS ENUM (
  'ACTIVE',
  'EXPIRED',
  'DELETED',
  'CORRUPTED'
);

-- Restore Status Enum
CREATE TYPE "RestoreStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

-- Restore Result Status Enum
CREATE TYPE "RestoreResultStatus" AS ENUM (
  'RESTORED',
  'SKIPPED',
  'FAILED'
);

-- Compression Type Enum
CREATE TYPE "CompressionType" AS ENUM (
  'NONE',
  'GZIP',
  'ZIP'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Template Export Table
CREATE TABLE "template_exports" (
  "id" TEXT PRIMARY KEY,
  "templateId" TEXT,
  "templateIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "organizationId" TEXT NOT NULL,
  "exportedBy" TEXT NOT NULL,
  "format" "TemplateExportFormat" NOT NULL,
  "size" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "lastDownloadAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "options" JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT "template_exports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_exports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_exports_exportedBy_fkey" FOREIGN KEY ("exportedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "template_exports_organizationId_exportedAt_idx" ON "template_exports"("organizationId", "exportedAt");
CREATE INDEX "template_exports_exportedBy_exportedAt_idx" ON "template_exports"("exportedBy", "exportedAt");
CREATE INDEX "template_exports_format_exportedAt_idx" ON "template_exports"("format", "exportedAt");

-- Template Import Table
CREATE TABLE "template_imports" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "importedBy" TEXT NOT NULL,
  "sourceFormat" "TemplateExportFormat" NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalTemplates" INTEGER NOT NULL,
  "importedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
  "errors" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "options" JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT "template_imports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_imports_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "template_imports_organizationId_importedAt_idx" ON "template_imports"("organizationId", "importedAt");
CREATE INDEX "template_imports_importedBy_importedAt_idx" ON "template_imports"("importedBy", "importedAt");
CREATE INDEX "template_imports_status_importedAt_idx" ON "template_imports"("status", "importedAt");

-- Template Import Result Table
CREATE TABLE "template_import_results" (
  "id" TEXT PRIMARY KEY,
  "importId" TEXT NOT NULL,
  "originalId" TEXT,
  "newTemplateId" TEXT,
  "templateName" TEXT NOT NULL,
  "status" "ImportResultStatus" NOT NULL,
  "errors" JSONB NOT NULL DEFAULT '[]',
  "fieldsMigrated" INTEGER NOT NULL DEFAULT 0,
  "recipientsMigrated" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "template_import_results_importId_fkey" FOREIGN KEY ("importId") REFERENCES "template_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_import_results_newTemplateId_fkey" FOREIGN KEY ("newTemplateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "template_import_results_importId_status_idx" ON "template_import_results"("importId", "status");
CREATE INDEX "template_import_results_newTemplateId_idx" ON "template_import_results"("newTemplateId");

-- Template Migration Table
CREATE TABLE "template_migrations" (
  "id" TEXT PRIMARY KEY,
  "sourceSystem" "MigrationSourceSystem" NOT NULL,
  "targetOrganizationId" TEXT NOT NULL,
  "migratedBy" TEXT NOT NULL,
  "migratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalTemplates" INTEGER NOT NULL,
  "migratedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "status" "MigrationStatus" NOT NULL DEFAULT 'PENDING',
  "isDryRun" BOOLEAN NOT NULL DEFAULT false,
  "errors" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "options" JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT "template_migrations_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_migrations_migratedBy_fkey" FOREIGN KEY ("migratedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "template_migrations_targetOrganizationId_migratedAt_idx" ON "template_migrations"("targetOrganizationId", "migratedAt");
CREATE INDEX "template_migrations_migratedBy_migratedAt_idx" ON "template_migrations"("migratedBy", "migratedAt");
CREATE INDEX "template_migrations_sourceSystem_status_idx" ON "template_migrations"("sourceSystem", "status");

-- Template Migration Result Table
CREATE TABLE "template_migration_results" (
  "id" TEXT PRIMARY KEY,
  "migrationId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "targetTemplateId" TEXT,
  "templateName" TEXT NOT NULL,
  "status" "MigrationResultStatus" NOT NULL,
  "fieldsMigrated" INTEGER NOT NULL DEFAULT 0,
  "recipientsMigrated" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "template_migration_results_migrationId_fkey" FOREIGN KEY ("migrationId") REFERENCES "template_migrations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_migration_results_targetTemplateId_fkey" FOREIGN KEY ("targetTemplateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "template_migration_results_migrationId_status_idx" ON "template_migration_results"("migrationId", "status");
CREATE INDEX "template_migration_results_targetTemplateId_idx" ON "template_migration_results"("targetTemplateId");

-- Template Backup Table
CREATE TABLE "template_backups" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "templateCount" INTEGER NOT NULL,
  "size" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "backupPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "retention" TIMESTAMP(3) NOT NULL,
  "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
  "compressionType" "CompressionType" NOT NULL DEFAULT 'NONE',
  "status" "BackupStatus" NOT NULL DEFAULT 'ACTIVE',
  "restoredCount" INTEGER NOT NULL DEFAULT 0,
  "lastRestoredAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "options" JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT "template_backups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_backups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "template_backups_organizationId_createdAt_idx" ON "template_backups"("organizationId", "createdAt");
CREATE INDEX "template_backups_createdBy_createdAt_idx" ON "template_backups"("createdBy", "createdAt");
CREATE INDEX "template_backups_status_retention_idx" ON "template_backups"("status", "retention");

-- Template Restore Table
CREATE TABLE "template_restores" (
  "id" TEXT PRIMARY KEY,
  "backupId" TEXT NOT NULL,
  "restoredBy" TEXT NOT NULL,
  "targetOrganizationId" TEXT,
  "restoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalTemplates" INTEGER NOT NULL,
  "restoredCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "status" "RestoreStatus" NOT NULL DEFAULT 'PENDING',
  "errors" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "options" JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT "template_restores_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "template_backups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_restores_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "template_restores_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "template_restores_backupId_restoredAt_idx" ON "template_restores"("backupId", "restoredAt");
CREATE INDEX "template_restores_restoredBy_restoredAt_idx" ON "template_restores"("restoredBy", "restoredAt");
CREATE INDEX "template_restores_status_restoredAt_idx" ON "template_restores"("status", "restoredAt");

-- Template Restore Result Table
CREATE TABLE "template_restore_results" (
  "id" TEXT PRIMARY KEY,
  "restoreId" TEXT NOT NULL,
  "originalId" TEXT NOT NULL,
  "newTemplateId" TEXT,
  "templateName" TEXT NOT NULL,
  "status" "RestoreResultStatus" NOT NULL,
  "errors" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "template_restore_results_restoreId_fkey" FOREIGN KEY ("restoreId") REFERENCES "template_restores"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_restore_results_newTemplateId_fkey" FOREIGN KEY ("newTemplateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "template_restore_results_restoreId_status_idx" ON "template_restore_results"("restoreId", "status");
CREATE INDEX "template_restore_results_newTemplateId_idx" ON "template_restore_results"("newTemplateId");

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "template_exports" IS 'Stores metadata about template exports';
COMMENT ON TABLE "template_imports" IS 'Stores metadata about template imports';
COMMENT ON TABLE "template_import_results" IS 'Stores individual results for each template in an import operation';
COMMENT ON TABLE "template_migrations" IS 'Stores metadata about template migrations from external systems';
COMMENT ON TABLE "template_migration_results" IS 'Stores individual results for each template in a migration operation';
COMMENT ON TABLE "template_backups" IS 'Stores metadata about template backups';
COMMENT ON TABLE "template_restores" IS 'Stores metadata about template restore operations';
COMMENT ON TABLE "template_restore_results" IS 'Stores individual results for each template in a restore operation';
