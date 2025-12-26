-- Multi-tenant organization architecture optimization indexes
-- These indexes ensure efficient data isolation and organization-scoped queries

-- Organization-scoped indexes for efficient tenant isolation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_organization_id ON templates(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signing_requests_organization_id ON signing_requests(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_events_organization_id ON audit_events(organization_id);

-- Composite indexes for common multi-tenant queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_active ON users(organization_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_org_status ON documents(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_org_active ON templates(organization_id, is_archived);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signing_requests_org_status ON signing_requests(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_org_active ON teams(organization_id, is_active);

-- Time-based indexes for audit and analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_events_org_timestamp ON audit_events(organization_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_org_created ON documents(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_org_created ON templates(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signing_requests_org_created ON signing_requests(organization_id, created_at DESC);

-- User access pattern indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_team ON team_members(user_id, team_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_org ON user_roles(user_id, role_id);

-- Organization configuration indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_slug ON organizations(slug) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_domain ON organizations(domain) WHERE domain IS NOT NULL AND is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_active ON organizations(is_active, created_at DESC);

-- Resource usage tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_records_subscription ON usage_records(subscription_id, timestamp DESC);

-- Security and access control indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, is_active, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_tokens_user_active ON api_tokens(user_id, is_active, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_org_type ON security_events(organization_id, type, timestamp DESC);

-- Document sharing and collaboration indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_shares_doc_active ON document_shares(document_id, is_active, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_shares_template_active ON template_shares(template_id, is_active, expires_at);

-- Workflow and process indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_org_status ON workflows(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_workflow_status ON workflow_executions(workflow_id, status);

-- Performance optimization: partial indexes for active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_users_org ON users(organization_id, created_at DESC) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_teams_org ON teams(organization_id, created_at DESC) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_organizations ON organizations(created_at DESC) WHERE is_active = true;

-- Add comments for documentation
COMMENT ON INDEX idx_users_organization_id IS 'Primary index for multi-tenant user isolation';
COMMENT ON INDEX idx_documents_organization_id IS 'Primary index for multi-tenant document isolation';
COMMENT ON INDEX idx_templates_organization_id IS 'Primary index for multi-tenant template isolation';
COMMENT ON INDEX idx_signing_requests_organization_id IS 'Primary index for multi-tenant signing request isolation';
COMMENT ON INDEX idx_teams_organization_id IS 'Primary index for multi-tenant team isolation';
COMMENT ON INDEX idx_audit_events_organization_id IS 'Primary index for multi-tenant audit event isolation';

-- Analyze tables to update statistics after index creation
ANALYZE users;
ANALYZE organizations;
ANALYZE teams;
ANALYZE documents;
ANALYZE templates;
ANALYZE signing_requests;
ANALYZE audit_events;