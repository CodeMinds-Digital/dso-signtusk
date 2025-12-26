-- Migration: Add template performance optimization tables
-- Created: 2024-12-20

-- Template performance metrics table
CREATE TABLE IF NOT EXISTS template_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'load', 'render', 'cache_hit', 'cache_miss'
    duration INTEGER, -- in milliseconds (for load/render metrics)
    value DECIMAL(10,2), -- for other numeric metrics
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Template optimizations table
CREATE TABLE IF NOT EXISTS template_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    optimizations TEXT[] NOT NULL DEFAULT '{}',
    improvement_estimate DECIMAL(5,2) DEFAULT 0, -- percentage improvement
    applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Template usage analytics table (for pattern analysis)
CREATE TABLE IF NOT EXISTS template_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'view', 'instantiate', 'share', 'edit', etc.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Template cache statistics table
CREATE TABLE IF NOT EXISTS template_cache_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    cache_key VARCHAR(500) NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0,
    miss_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    cache_size INTEGER DEFAULT 0, -- in bytes
    compression_ratio DECIMAL(5,2), -- if compression is used
    ttl INTEGER, -- time to live in seconds
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_template_id ON template_performance_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_type_timestamp ON template_performance_metrics(metric_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_template_performance_metrics_timestamp ON template_performance_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_template_optimizations_template_id ON template_optimizations(template_id);
CREATE INDEX IF NOT EXISTS idx_template_optimizations_created_at ON template_optimizations(created_at);

CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_template_id ON template_usage_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_event_type ON template_usage_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_timestamp ON template_usage_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_org_id ON template_usage_analytics(organization_id);

CREATE INDEX IF NOT EXISTS idx_template_cache_stats_template_id ON template_cache_stats(template_id);
CREATE INDEX IF NOT EXISTS idx_template_cache_stats_cache_key ON template_cache_stats(cache_key);
CREATE INDEX IF NOT EXISTS idx_template_cache_stats_last_accessed ON template_cache_stats(last_accessed);

-- Add performance-related columns to existing templates table if they don't exist
DO $$ 
BEGIN
    -- Add performance score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'performance_score') THEN
        ALTER TABLE templates ADD COLUMN performance_score INTEGER DEFAULT 85 CHECK (performance_score >= 0 AND performance_score <= 100);
    END IF;
    
    -- Add last optimized timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'last_optimized_at') THEN
        ALTER TABLE templates ADD COLUMN last_optimized_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add cache settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'cache_settings') THEN
        ALTER TABLE templates ADD COLUMN cache_settings JSONB DEFAULT '{"enabled": true, "ttl": 3600}';
    END IF;
END $$;

-- Create a view for template performance summary
CREATE OR REPLACE VIEW template_performance_summary AS
SELECT 
    t.id,
    t.name,
    t.organization_id,
    t.performance_score,
    t.last_optimized_at,
    COALESCE(usage_stats.total_usage, 0) as total_usage,
    COALESCE(usage_stats.recent_usage, 0) as recent_usage,
    COALESCE(perf_metrics.avg_load_time, 0) as avg_load_time,
    COALESCE(perf_metrics.avg_render_time, 0) as avg_render_time,
    COALESCE(cache_stats.hit_rate, 0) as cache_hit_rate,
    COALESCE(cache_stats.total_requests, 0) as total_cache_requests
FROM templates t
LEFT JOIN (
    SELECT 
        template_id,
        COUNT(*) as total_usage,
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_usage
    FROM template_usage_analytics 
    WHERE event_type = 'instantiate'
    GROUP BY template_id
) usage_stats ON t.id = usage_stats.template_id
LEFT JOIN (
    SELECT 
        template_id,
        AVG(CASE WHEN metric_type = 'load' THEN duration END) as avg_load_time,
        AVG(CASE WHEN metric_type = 'render' THEN duration END) as avg_render_time
    FROM template_performance_metrics 
    WHERE timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY template_id
) perf_metrics ON t.id = perf_metrics.template_id
LEFT JOIN (
    SELECT 
        template_id,
        CASE 
            WHEN SUM(hit_count + miss_count) > 0 
            THEN (SUM(hit_count)::DECIMAL / SUM(hit_count + miss_count)) * 100 
            ELSE 0 
        END as hit_rate,
        SUM(hit_count + miss_count) as total_requests
    FROM template_cache_stats 
    GROUP BY template_id
) cache_stats ON t.id = cache_stats.template_id;

-- Function to update template performance score
CREATE OR REPLACE FUNCTION update_template_performance_score(template_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    load_time DECIMAL;
    render_time DECIMAL;
    cache_hit_rate DECIMAL;
    usage_frequency INTEGER;
    score INTEGER := 100;
BEGIN
    -- Get recent performance metrics
    SELECT 
        COALESCE(AVG(CASE WHEN metric_type = 'load' THEN duration END), 0),
        COALESCE(AVG(CASE WHEN metric_type = 'render' THEN duration END), 0)
    INTO load_time, render_time
    FROM template_performance_metrics 
    WHERE template_id = template_uuid 
    AND timestamp >= NOW() - INTERVAL '7 days';
    
    -- Get cache hit rate
    SELECT 
        CASE 
            WHEN SUM(hit_count + miss_count) > 0 
            THEN (SUM(hit_count)::DECIMAL / SUM(hit_count + miss_count)) * 100 
            ELSE 0 
        END
    INTO cache_hit_rate
    FROM template_cache_stats 
    WHERE template_id = template_uuid;
    
    -- Get usage frequency (last 24 hours)
    SELECT COUNT(*)
    INTO usage_frequency
    FROM template_usage_analytics 
    WHERE template_id = template_uuid 
    AND event_type = 'instantiate'
    AND timestamp >= NOW() - INTERVAL '24 hours';
    
    -- Calculate score based on metrics
    IF load_time > 1000 THEN
        score := score - 20;
    ELSIF load_time > 500 THEN
        score := score - 10;
    END IF;
    
    IF render_time > 500 THEN
        score := score - 15;
    ELSIF render_time > 200 THEN
        score := score - 5;
    END IF;
    
    IF cache_hit_rate < 50 THEN
        score := score - 25;
    ELSIF cache_hit_rate < 80 THEN
        score := score - 10;
    END IF;
    
    -- Ensure score is within bounds
    score := GREATEST(0, LEAST(100, score));
    
    -- Update the template
    UPDATE templates 
    SET performance_score = score 
    WHERE id = template_uuid;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update performance score when metrics are added
CREATE OR REPLACE FUNCTION trigger_update_performance_score()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_template_performance_score(NEW.template_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_performance_score_on_metrics ON template_performance_metrics;
CREATE TRIGGER update_performance_score_on_metrics
    AFTER INSERT ON template_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_performance_score();

DROP TRIGGER IF EXISTS update_performance_score_on_cache_stats ON template_cache_stats;
CREATE TRIGGER update_performance_score_on_cache_stats
    AFTER INSERT OR UPDATE ON template_cache_stats
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_performance_score();

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON template_performance_metrics TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON template_optimizations TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON template_usage_analytics TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON template_cache_stats TO app_user;
-- GRANT SELECT ON template_performance_summary TO app_user;