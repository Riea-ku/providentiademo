-- Historical Intelligence Database Schema
-- PostgreSQL with pgvector for semantic search

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Reports table with AI metadata
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    content JSONB NOT NULL,
    report_type TEXT NOT NULL,
    generated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- AI metadata
    ai_metadata JSONB DEFAULT '{}',
    embeddings_vector VECTOR(1536),
    summary_embedding VECTOR(1536),
    tags TEXT[] DEFAULT '{}',
    searchable_content TEXT,
    
    -- Access tracking
    accessed_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    
    -- Reference entities (links to equipment, predictions, etc.)
    reference_entities JSONB DEFAULT '{}'
);

-- Reports archive for historical versioning
CREATE TABLE IF NOT EXISTS reports_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1,
    report_data JSONB NOT NULL,
    archived_at TIMESTAMPTZ DEFAULT now(),
    archived_by TEXT,
    archive_reason TEXT,
    metadata JSONB DEFAULT '{}'
);

-- System events for historical tracking
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    user_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    
    -- AI metadata
    event_embedding VECTOR(1536),
    searchable_text TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Related events
    related_event_ids UUID[] DEFAULT '{}'
);

-- Historical patterns
CREATE TABLE IF NOT EXISTS historical_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence_score FLOAT,
    occurrences INTEGER DEFAULT 1,
    first_detected TIMESTAMPTZ DEFAULT now(),
    last_detected TIMESTAMPTZ DEFAULT now(),
    
    -- Pattern embeddings for similarity search
    pattern_embedding VECTOR(1536),
    
    -- Affected entities
    affected_entities JSONB DEFAULT '{}',
    
    -- Outcomes
    outcomes JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}'
);

-- Chatbot conversations with historical context
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    
    -- Context used
    historical_context JSONB DEFAULT '{}',
    current_system_state JSONB DEFAULT '{}',
    
    -- Citations
    cited_reports UUID[] DEFAULT '{}',
    cited_events UUID[] DEFAULT '{}',
    
    -- Message embeddings
    message_embedding VECTOR(1536),
    response_embedding VECTOR(1536)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_embedding ON reports USING ivfflat (embeddings_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports (report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_entities ON reports USING gin (reference_entities);
CREATE INDEX IF NOT EXISTS idx_reports_tags ON reports USING gin (tags);

CREATE INDEX IF NOT EXISTS idx_events_type ON system_events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON system_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_entity ON system_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_embedding ON system_events USING ivfflat (event_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_patterns_type ON historical_patterns (pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON historical_patterns (confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_embedding ON historical_patterns USING ivfflat (pattern_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_chatbot_session ON chatbot_conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_timestamp ON chatbot_conversations (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_message_embedding ON chatbot_conversations USING ivfflat (message_embedding vector_cosine_ops);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_reports_searchable ON reports USING gin (to_tsvector('english', searchable_content));
CREATE INDEX IF NOT EXISTS idx_events_searchable ON system_events USING gin (to_tsvector('english', searchable_text));
