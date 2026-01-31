"""
Event Orchestrator Service - Tracks all system events with historical context
"""
import logging
from typing import Dict, List, Optional
from uuid import uuid4
from datetime import datetime, timezone
import json

logger = logging.getLogger(__name__)


class EventOrchestratorService:
    """Orchestrates and tracks all system events with historical intelligence"""
    
    def __init__(self, postgres_pool, embedding_service, report_storage):
        self.pg_pool = postgres_pool
        self.embedding_service = embedding_service
        self.report_storage = report_storage
    
    async def log_event(
        self,
        event_type: str,
        event_data: Dict,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> str:
        """
        Log a system event with historical tracking
        
        Args:
            event_type: Type of event (e.g., 'prediction_created', 'equipment_failure')
            event_data: Event data
            entity_type: Type of entity (e.g., 'equipment', 'prediction')
            entity_id: ID of the entity
            user_id: ID of the user who triggered the event
            
        Returns:
            event_id: UUID of the logged event
        """
        try:
            # Generate searchable text
            searchable_text = self._generate_searchable_text(event_type, event_data)
            
            # Generate embedding
            event_embedding = await self.embedding_service.embed_text(searchable_text)
            
            # Extract tags
            tags = self._extract_event_tags(event_type, event_data)
            
            # Insert event
            event_id = str(uuid4())
            
            async with self.pg_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO system_events (
                        id, event_type, event_data, entity_type, entity_id,
                        user_id, timestamp, event_embedding, searchable_text, tags
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """,
                    event_id, event_type, json.dumps(event_data), entity_type, entity_id,
                    user_id, datetime.now(timezone.utc), event_embedding, 
                    searchable_text, tags
                )
            
            logger.info(f"Logged event {event_id}: {event_type}")
            return event_id
            
        except Exception as e:
            logger.error(f"Failed to log event: {e}")
            raise
    
    async def get_historical_context(
        self,
        event_type: str,
        current_data: Dict,
        lookback_days: int = 365
    ) -> Dict:
        """
        Retrieve relevant historical context for an event
        
        Args:
            event_type: Type of event
            current_data: Current event data
            lookback_days: How far back to look
            
        Returns:
            Historical context including similar events, related reports, patterns
        """
        try:
            # Generate query from event
            query = self._generate_query_from_event(event_type, current_data)
            
            # Get similar historical events
            similar_events = await self._get_similar_historical_events(
                query, event_type, lookback_days
            )
            
            # Get related reports
            related_reports = await self.report_storage.retrieve_similar_reports(
                query=query,
                limit=5
            )
            
            # Analyze historical outcomes
            outcomes = await self._analyze_historical_outcomes(similar_events)
            
            # Extract patterns
            patterns = self._extract_patterns(similar_events, related_reports)
            
            # Generate recommendations
            recommendations = self._generate_historical_recommendations(
                similar_events, related_reports, current_data
            )
            
            return {
                'similar_events': similar_events,
                'related_reports': related_reports,
                'historical_outcomes': outcomes,
                'patterns': patterns,
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get historical context: {e}")
            return {}
    
    async def _get_similar_historical_events(
        self,
        query: str,
        event_type: str,
        lookback_days: int
    ) -> List[Dict]:
        """Find similar historical events"""
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed_text(query)
            
            # Calculate lookback timestamp
            from datetime import timedelta
            lookback_time = datetime.now(timezone.utc) - timedelta(days=lookback_days)
            
            async with self.pg_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT 
                        id, event_type, event_data, entity_type, entity_id,
                        timestamp, tags,
                        1 - (event_embedding <=> $1::vector) AS similarity_score
                    FROM system_events
                    WHERE event_type = $2
                      AND timestamp >= $3
                      AND 1 - (event_embedding <=> $1::vector) > 0.6
                    ORDER BY event_embedding <=> $1::vector
                    LIMIT 20
                """, query_embedding, event_type, lookback_time)
            
            results = []
            for row in rows:
                results.append({
                    'id': str(row['id']),
                    'event_type': row['event_type'],
                    'event_data': json.loads(row['event_data']) if row['event_data'] else {},
                    'entity_type': row['entity_type'],
                    'entity_id': row['entity_id'],
                    'timestamp': row['timestamp'].isoformat(),
                    'tags': row['tags'] or [],
                    'similarity_score': float(row['similarity_score'])
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to get similar events: {e}")
            return []
    
    def _generate_query_from_event(self, event_type: str, data: Dict) -> str:
        """Generate a search query from event data"""
        query_parts = [event_type.replace('_', ' ')]
        
        # Add relevant fields
        if 'failure_mode' in data:
            query_parts.append(data['failure_mode'])
        if 'equipment_type' in data:
            query_parts.append(data['equipment_type'])
        if 'description' in data:
            query_parts.append(data['description'][:100])
        
        return ' '.join(query_parts)
    
    def _generate_searchable_text(self, event_type: str, event_data: Dict) -> str:
        """Generate searchable text from event"""
        text_parts = [event_type.replace('_', ' ')]
        
        # Add stringified data
        for key, value in event_data.items():
            if isinstance(value, (str, int, float)):
                text_parts.append(f"{key}: {value}")
        
        return ' '.join(text_parts)
    
    def _extract_event_tags(self, event_type: str, event_data: Dict) -> List[str]:
        """Extract tags from event"""
        tags = [event_type]
        
        # Add entity type if present
        if 'entity_type' in event_data:
            tags.append(event_data['entity_type'])
        
        # Add severity if present
        if 'severity' in event_data:
            tags.append(f"severity_{event_data['severity']}")
        
        return tags[:10]
    
    async def _analyze_historical_outcomes(self, similar_events: List[Dict]) -> Dict:
        """Analyze outcomes from similar historical events"""
        if not similar_events:
            return {'success_rate': 0, 'common_outcomes': []}
        
        # Simple analysis
        return {
            'total_similar_events': len(similar_events),
            'average_similarity': sum(e['similarity_score'] for e in similar_events) / len(similar_events),
            'time_span': f"{len(similar_events)} events over time"
        }
    
    def _extract_patterns(self, similar_events: List[Dict], related_reports: List[Dict]) -> Dict:
        """Extract patterns from historical data"""
        patterns = {
            'frequency': len(similar_events),
            'common_tags': []
        }
        
        # Extract common tags
        all_tags = []
        for event in similar_events:
            all_tags.extend(event.get('tags', []))
        
        # Count tag frequency
        from collections import Counter
        tag_counts = Counter(all_tags)
        patterns['common_tags'] = [tag for tag, count in tag_counts.most_common(5)]
        
        return patterns
    
    def _generate_historical_recommendations(
        self,
        similar_events: List[Dict],
        related_reports: List[Dict],
        current_data: Dict
    ) -> List[str]:
        """Generate recommendations based on historical data"""
        recommendations = []
        
        if similar_events:
            recommendations.append(
                f"Similar situation occurred {len(similar_events)} times in the past. "
                "Review historical outcomes for insights."
            )
        
        if related_reports:
            recommendations.append(
                f"Found {len(related_reports)} related reports with relevant insights."
            )
        
        return recommendations
