-- ============================================================================
-- VIDA AI PREDICTIVE ANALYTICS SYSTEM
-- Supabase Table Migrations
-- Supabase SQL Editor
-- ============================================================================

-- 1. CREATE prediction_analytics TABLE
CREATE TABLE IF NOT EXISTS prediction_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    analytics_package JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_generated BOOLEAN DEFAULT FALSE,
    dispatched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_prediction_id 
    ON prediction_analytics(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_generated_at 
    ON prediction_analytics(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_report_generated 
    ON prediction_analytics(report_generated);

-- Add comments
COMMENT ON TABLE prediction_analytics IS 'Stores analytics data generated from predictions';
COMMENT ON COLUMN prediction_analytics.analytics_package IS 'Complete analytics package including impact analysis, recommendations, etc.';


-- 2. CREATE automated_reports TABLE
CREATE TABLE IF NOT EXISTS automated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analytics_id UUID REFERENCES prediction_analytics(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL DEFAULT 'dispatch',
    report_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    generated_for UUID[] DEFAULT ARRAY[]::UUID[],
    dispatched_to UUID[] DEFAULT ARRAY[]::UUID[],
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'sent', 'dispatched', 'archived')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_automated_reports_analytics_id 
    ON automated_reports(analytics_id);
CREATE INDEX IF NOT EXISTS idx_automated_reports_status 
    ON automated_reports(status);
CREATE INDEX IF NOT EXISTS idx_automated_reports_created_at 
    ON automated_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automated_reports_report_type 
    ON automated_reports(report_type);

-- Add comments
COMMENT ON TABLE automated_reports IS 'Auto-generated reports from analytics';
COMMENT ON COLUMN automated_reports.content IS 'Complete report content including executive summary, recommendations, etc.';


-- 3. CREATE dispatch_history TABLE
CREATE TABLE IF NOT EXISTS dispatch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES automated_reports(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'acknowledged', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_history_report_id 
    ON dispatch_history(report_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_history_technician_id 
    ON dispatch_history(technician_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_history_work_order_id 
    ON dispatch_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_history_dispatched_at 
    ON dispatch_history(dispatched_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispatch_history_status 
    ON dispatch_history(status);

-- Add comments
COMMENT ON TABLE dispatch_history IS 'Tracks technician dispatch history for automated work orders';


-- 4. ADD NEW COLUMNS TO work_orders TABLE
-- Check if columns exist before adding
DO $$
BEGIN
    -- Add prediction_source column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'prediction_source'
    ) THEN
        ALTER TABLE work_orders 
        ADD COLUMN prediction_source UUID REFERENCES predictions(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_work_orders_prediction_source 
            ON work_orders(prediction_source);
        
        COMMENT ON COLUMN work_orders.prediction_source IS 'Links work order to originating prediction';
    END IF;

    -- Add auto_generated column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'auto_generated'
    ) THEN
        ALTER TABLE work_orders 
        ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;
        
        CREATE INDEX idx_work_orders_auto_generated 
            ON work_orders(auto_generated);
        
        COMMENT ON COLUMN work_orders.auto_generated IS 'Indicates if work order was auto-generated by analytics system';
    END IF;
END $$;


-- 5. CREATE predictions_history TABLE (for storing user predictions)
CREATE TABLE IF NOT EXISTS predictions_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    equipment_code VARCHAR(100),
    equipment_name VARCHAR(255),
    sensor_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    failure_types JSONB,
    health_score NUMERIC(5,2),
    time_to_failure_hours NUMERIC(10,2),
    maintenance_urgency VARCHAR(20),
    estimated_cost NUMERIC(12,2),
    confidence_score NUMERIC(5,2),
    auto_created_work_order_id UUID,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_predictions_history_equipment_id 
    ON predictions_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_predictions_history_created_at 
    ON predictions_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_history_archived_at 
    ON predictions_history(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_history_original_id 
    ON predictions_history(original_prediction_id);

-- Add comments
COMMENT ON TABLE predictions_history IS 'Historical archive of all predictions made by users';


-- 6. CREATE FUNCTION to auto-archive predictions
CREATE OR REPLACE FUNCTION archive_old_prediction()
RETURNS TRIGGER AS $$
BEGIN
    -- When a prediction is updated or deleted, archive it
    INSERT INTO predictions_history (
        original_prediction_id,
        equipment_id,
        equipment_code,
        equipment_name,
        sensor_data,
        prediction_result,
        failure_types,
        health_score,
        time_to_failure_hours,
        maintenance_urgency,
        estimated_cost,
        confidence_score,
        auto_created_work_order_id,
        acknowledged,
        acknowledged_by,
        acknowledged_at,
        created_at
    )
    SELECT 
        OLD.id,
        OLD.equipment_id,
        (SELECT equipment_code FROM equipment WHERE id = OLD.equipment_id),
        (SELECT name FROM equipment WHERE id = OLD.equipment_id),
        OLD.sensor_data,
        OLD.prediction_result,
        OLD.failure_types,
        OLD.health_score,
        OLD.time_to_failure_hours,
        OLD.maintenance_urgency,
        OLD.estimated_cost,
        OLD.confidence_score,
        OLD.auto_created_work_order_id,
        OLD.acknowledged,
        OLD.acknowledged_by,
        OLD.acknowledged_at,
        OLD.created_at;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_archive_prediction ON predictions;
CREATE TRIGGER trigger_archive_prediction
    BEFORE DELETE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION archive_old_prediction();


-- 7. CREATE VIEW for analytics dashboard
CREATE OR REPLACE VIEW analytics_dashboard AS
SELECT 
    pa.id as analytics_id,
    pa.prediction_id,
    p.equipment_id,
    e.name as equipment_name,
    e.equipment_code,
    p.health_score,
    p.confidence_score,
    p.maintenance_urgency,
    pa.analytics_package,
    pa.report_generated,
    pa.dispatched,
    ar.id as report_id,
    ar.status as report_status,
    dh.technician_id,
    dh.work_order_id,
    dh.status as dispatch_status,
    pa.generated_at,
    pa.created_at
FROM prediction_analytics pa
LEFT JOIN predictions p ON pa.prediction_id = p.id
LEFT JOIN equipment e ON p.equipment_id = e.id
LEFT JOIN automated_reports ar ON ar.analytics_id = pa.id
LEFT JOIN dispatch_history dh ON dh.report_id = ar.id
ORDER BY pa.generated_at DESC;

COMMENT ON VIEW analytics_dashboard IS 'Comprehensive view of analytics pipeline: predictions → analytics → reports → dispatch';


-- 8. CREATE FUNCTION to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_prediction_analytics_updated_at
    BEFORE UPDATE ON prediction_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automated_reports_updated_at
    BEFORE UPDATE ON automated_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 9. ENABLE ROW LEVEL SECURITY (Optional - uncomment if needed)
-- ALTER TABLE prediction_analytics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE automated_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dispatch_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions_history ENABLE ROW LEVEL SECURITY;


-- 10. GRANT PERMISSIONS (adjust as needed for your auth setup)
-- GRANT ALL ON prediction_analytics TO authenticated;
-- GRANT ALL ON automated_reports TO authenticated;
-- GRANT ALL ON dispatch_history TO authenticated;
-- GRANT ALL ON predictions_history TO authenticated;


-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify tables were created successfully
-- ============================================================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('prediction_analytics', 'automated_reports', 'dispatch_history', 'predictions_history')
ORDER BY table_name;

-- Check new columns in work_orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'work_orders' 
  AND column_name IN ('prediction_source', 'auto_generated');

-- Check if view exists
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'analytics_dashboard';

-- Sample query to test the analytics_dashboard view
-- SELECT * FROM analytics_dashboard LIMIT 5;


-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to add sample data
/*
-- Insert sample prediction
INSERT INTO predictions (
    id, equipment_id, sensor_data, prediction_result, 
    health_score, confidence_score, maintenance_urgency
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM equipment LIMIT 1),
    '{"motor_temp": 85, "vibration": 12.5}'::jsonb,
    '{"health_score": 68, "urgency": "high"}'::jsonb,
    68, 92, 'high'
);
*/


-- ============================================================================
-- CLEANUP (if you need to remove tables)
-- ============================================================================
-- CAUTION: This will delete all data!
-- Uncomment only if you need to start over

/*
DROP TRIGGER IF EXISTS trigger_archive_prediction ON predictions;
DROP FUNCTION IF EXISTS archive_old_prediction();
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP VIEW IF EXISTS analytics_dashboard;
DROP TABLE IF EXISTS dispatch_history CASCADE;
DROP TABLE IF EXISTS automated_reports CASCADE;
DROP TABLE IF EXISTS prediction_analytics CASCADE;
DROP TABLE IF EXISTS predictions_history CASCADE;

-- Remove columns from work_orders
ALTER TABLE work_orders DROP COLUMN IF EXISTS prediction_source;
ALTER TABLE work_orders DROP COLUMN IF EXISTS auto_generated;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON SCHEMA public IS 'Vida AI Predictive Analytics System - Migration completed';
