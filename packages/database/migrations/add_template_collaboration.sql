-- Migration: Add Template Collaboration Features
-- This migration adds support for collaborative template editing, commenting, reviews, and change tracking

-- Template Comments Table
CREATE TABLE IF NOT EXISTS "template_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "mentions" JSONB DEFAULT '[]',
    "attachments" JSONB DEFAULT '[]',
    "isResolved" BOOLEAN DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("parentId") REFERENCES "template_comments"("id") ON DELETE CASCADE,
    FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "template_comments_templateId_idx" ON "template_comments"("templateId");
CREATE INDEX "template_comments_userId_idx" ON "template_comments"("userId");
CREATE INDEX "template_comments_parentId_idx" ON "template_comments"("parentId");
CREATE INDEX "template_comments_isResolved_idx" ON "template_comments"("isResolved");

-- Template Reviews Table
CREATE TABLE IF NOT EXISTS "template_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "versionId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "comments" TEXT,
    "checklist" JSONB DEFAULT '[]',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP,
    "dueDate" TIMESTAMP,
    "priority" TEXT DEFAULT 'medium',
    "metadata" JSONB DEFAULT '{}',
    FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE,
    FOREIGN KEY ("versionId") REFERENCES "template_versions"("id") ON DELETE SET NULL,
    FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "template_reviews_templateId_idx" ON "template_reviews"("templateId");
CREATE INDEX "template_reviews_reviewerId_idx" ON "template_reviews"("reviewerId");
CREATE INDEX "template_reviews_status_idx" ON "template_reviews"("status");
CREATE INDEX "template_reviews_versionId_idx" ON "template_reviews"("versionId");

-- Template Change Notifications Table
CREATE TABLE IF NOT EXISTS "template_change_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeDescription" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "versionId" TEXT,
    "isRead" BOOLEAN DEFAULT false,
    "readAt" TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("versionId") REFERENCES "template_versions"("id") ON DELETE SET NULL
);

CREATE INDEX "template_change_notifications_templateId_idx" ON "template_change_notifications"("templateId");
CREATE INDEX "template_change_notifications_userId_idx" ON "template_change_notifications"("userId");
CREATE INDEX "template_change_notifications_isRead_idx" ON "template_change_notifications"("isRead");

-- Template Collaborators Table
CREATE TABLE IF NOT EXISTS "template_collaborators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "permissions" JSONB DEFAULT '{}',
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE CASCADE,
    UNIQUE("templateId", "userId")
);

CREATE INDEX "template_collaborators_templateId_idx" ON "template_collaborators"("templateId");
CREATE INDEX "template_collaborators_userId_idx" ON "template_collaborators"("userId");
CREATE INDEX "template_collaborators_isActive_idx" ON "template_collaborators"("isActive");

-- Template Edit Sessions Table (for tracking concurrent editing)
CREATE TABLE IF NOT EXISTS "template_edit_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "changes" JSONB DEFAULT '[]',
    FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "template_edit_sessions_templateId_idx" ON "template_edit_sessions"("templateId");
CREATE INDEX "template_edit_sessions_userId_idx" ON "template_edit_sessions"("userId");
CREATE INDEX "template_edit_sessions_isActive_idx" ON "template_edit_sessions"("isActive");

-- Add collaboration tracking fields to templates table
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "isCollaborative" BOOLEAN DEFAULT false;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "lockStatus" TEXT DEFAULT 'unlocked';
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "lockedBy" TEXT;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP;

-- Add foreign key for lockedBy
-- Note: This will be added conditionally if the column doesn't already have a constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'templates_lockedBy_fkey'
    ) THEN
        ALTER TABLE "templates" ADD CONSTRAINT "templates_lockedBy_fkey" 
        FOREIGN KEY ("lockedBy") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;
END $$;
