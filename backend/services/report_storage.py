"""
Report Storage Service - Core service for storing and retrieving reports with AI metadata
Now supports fallback to memory when PostgreSQL is unavailable
"""
import logging
from typing import Dict, List, Optional
from uuid import uuid4
from datetime import datetime, timezone
import json

logger = logging.getLogger(__name__)


class ReportStorageService:
    """Stores, retrieves, and enables AI access to all reports"""
    
    def __init__(self, postgres_pool, embedding_service):
        self.pg_pool = postgres_pool
        self.embedding_service = embedding_service
        self._memory_reports = {}  # Fallback storage when PostgreSQL unavailable
    
    async def store_report_with_ai_metadata(self, report_data: Dict) -> str:
        """
        Store a report with full AI metadata
        
        Args:
            report_data: Report data including title, summary, content, type, etc.
            
        Returns:
            report_id: UUID of the stored report
        """
        # If no PostgreSQL, store in memory
        if self.pg_pool is None:
            return await self._store_in_memory(report_data)
        
        try:
            # Extract fields
            title = report_data.get('title', 'Untitled Report')
            summary = report_data.get('summary', '')
            content = report_data.get('content', {})
            report_type = report_data.get('report_type', 'general')
            generated_by = report_data.get('generated_by', 'system')
            
            # Generate searchable text
            searchable_content = f"{title} {summary}"
            if 'recommendations' in content:
                searchable_content += " " + " ".join(content.get('recommendations', []))
            
            # Generate embeddings
            title_embedding = await self.embedding_service.embed_text(title)
            summary_embedding = await self.embedding_service.embed_text(searchable_content)
            
            # Extract tags (simple keyword extraction)
            tags = self._extract_tags(title, summary, content)
            
            # Extract entity references
            reference_entities = report_data.get('reference_entities', {})
            
            # Generate AI metadata
            ai_metadata = {
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'embedding_model': self.embedding_service.model_name,
                'auto_extracted_tags': tags,
                'content_summary': summary[:200] if summary else ''
            }
            
            # Insert into database
            report_id = str(uuid4())
            
            async with self.pg_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO reports (
                        id, title, summary, content, report_type, generated_by,
                        ai_metadata, embeddings_vector, summary_embedding,
                        tags, searchable_content, reference_entities,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9::vector, $10, $11, $12, $13, $14)
                """, 
                    report_id, title, summary, json.dumps(content), report_type, generated_by,
                    json.dumps(ai_metadata), str(title_embedding), str(summary_embedding),
                    tags, searchable_content, json.dumps(reference_entities),
                    datetime.now(timezone.utc), datetime.now(timezone.utc)
                )
            
            logger.info(f"✅ Stored report {report_id}: {title}")
            return report_id
            
        except Exception as e:
            logger.error(f"❌ Failed to store report: {e}")
            raise
    
    async def retrieve_similar_reports(
        self, 
        query: str, 
        context: Optional[Dict] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Retrieve reports similar to the query using semantic search
        
        Args:
            query: Search query
            context: Optional context for filtering
            limit: Maximum number of results
            
        Returns:
            List of similar reports with metadata
        """
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed_text(query)
            
            # Search by vector similarity
            async with self.pg_pool.acquire() as conn:
                # Vector similarity search using cosine distance (lower threshold for better recall)
                rows = await conn.fetch("""
                    SELECT 
                        id, title, summary, content, report_type, generated_by,
                        ai_metadata, tags, reference_entities, created_at,
                        1 - (embeddings_vector <=> $1::vector) AS similarity_score
                    FROM reports
                    ORDER BY embeddings_vector <=> $1::vector
                    LIMIT $2
                """, str(query_embedding), limit)
            
            # Convert to dict and enrich
            results = []
            for row in rows:
                report = {
                    'id': str(row['id']),
                    'title': row['title'],
                    'summary': row['summary'],
                    'content': json.loads(row['content']) if row['content'] else {},
                    'report_type': row['report_type'],
                    'generated_by': row['generated_by'],
                    'ai_metadata': json.loads(row['ai_metadata']) if row['ai_metadata'] else {},
                    'tags': row['tags'] or [],
                    'reference_entities': json.loads(row['reference_entities']) if row['reference_entities'] else {},
                    'created_at': row['created_at'].isoformat(),
                    'similarity_score': float(row['similarity_score'])
                }
                results.append(report)
            
            # Track access
            if results:
                await self._track_report_access([r['id'] for r in results], query)
            
            logger.info(f"Found {len(results)} similar reports for query: {query[:50]}")
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve similar reports: {e}")
            return []
    
    async def get_report_by_id(self, report_id: str) -> Optional[Dict]:
        """Get a specific report by ID"""
        try:
            async with self.pg_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT 
                        id, title, summary, content, report_type, generated_by,
                        ai_metadata, tags, reference_entities, created_at,
                        accessed_count, last_accessed
                    FROM reports
                    WHERE id = $1
                """, report_id)
            
            if not row:
                return None
            
            report = {
                'id': str(row['id']),
                'title': row['title'],
                'summary': row['summary'],
                'content': json.loads(row['content']) if row['content'] else {},
                'report_type': row['report_type'],
                'generated_by': row['generated_by'],
                'ai_metadata': json.loads(row['ai_metadata']) if row['ai_metadata'] else {},
                'tags': row['tags'] or [],
                'reference_entities': json.loads(row['reference_entities']) if row['reference_entities'] else {},
                'created_at': row['created_at'].isoformat(),
                'accessed_count': row['accessed_count'],
                'last_accessed': row['last_accessed'].isoformat() if row['last_accessed'] else None
            }
            
            # Track access
            await self._track_report_access([report_id], f"get_by_id:{report_id}")
            
            return report
            
        except Exception as e:
            logger.error(f"❌ Failed to get report by ID: {e}")
            return None
    
    async def get_report_history_for_entity(
        self, 
        entity_type: str, 
        entity_id: str
    ) -> List[Dict]:
        """Get all reports related to a specific entity (equipment, prediction, etc.)"""
        try:
            async with self.pg_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT 
                        id, title, summary, report_type, created_at, tags
                    FROM reports
                    WHERE reference_entities @> $1::jsonb
                    ORDER BY created_at DESC
                """, json.dumps({entity_type: [entity_id]}))
            
            results = []
            for row in rows:
                results.append({
                    'id': str(row['id']),
                    'title': row['title'],
                    'summary': row['summary'],
                    'report_type': row['report_type'],
                    'created_at': row['created_at'].isoformat(),
                    'tags': row['tags'] or []
                })
            
            logger.info(f"Found {len(results)} reports for {entity_type}:{entity_id}")
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to get entity history: {e}")
            return []
    
    async def _track_report_access(self, report_ids: List[str], query: str):
        """Track report access for learning"""
        try:
            async with self.pg_pool.acquire() as conn:
                for report_id in report_ids:
                    await conn.execute("""
                        UPDATE reports
                        SET accessed_count = accessed_count + 1,
                            last_accessed = $1
                        WHERE id = $2
                    """, datetime.now(timezone.utc), report_id)
        except Exception as e:
            logger.warning(f"Failed to track report access: {e}")
    
    def _extract_tags(self, title: str, summary: str, content: Dict) -> List[str]:
        """Simple tag extraction from text"""
        tags = set()
        
        # Extract from title and summary
        text = f"{title} {summary}".lower()
        
        # Common keywords
        keywords = ['failure', 'maintenance', 'prediction', 'equipment', 'alert', 
                   'critical', 'warning', 'repair', 'inspection', 'performance']
        
        for keyword in keywords:
            if keyword in text:
                tags.add(keyword)
        
        # Add from report type
        if 'simulation' in text:
            tags.add('simulation')
        if 'analytics' in text:
            tags.add('analytics')
        
        return list(tags)[:10]  # Max 10 tags
    
    # ============ Memory Fallback Methods (when PostgreSQL unavailable) ============
    
    async def _store_in_memory(self, report_data: Dict) -> str:
        """Store report in memory when PostgreSQL unavailable"""
        report_id = str(uuid4())
        self._memory_reports[report_id] = {
            'id': report_id,
            'title': report_data.get('title', 'Untitled Report'),
            'summary': report_data.get('summary', ''),
            'content': report_data.get('content', {}),
            'report_type': report_data.get('report_type', 'general'),
            'generated_by': report_data.get('generated_by', 'system'),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'tags': self._extract_tags(
                report_data.get('title', ''),
                report_data.get('summary', ''),
                report_data.get('content', {})
            )
        }
        logger.info(f"✅ Stored report in memory: {report_id}")
        return report_id
    
    async def _retrieve_from_memory(self, query: str, limit: int = 10) -> List[Dict]:
        """Retrieve reports from memory (simple keyword matching)"""
        query_lower = query.lower()
        results = []
        
        for report_id, report in self._memory_reports.items():
            # Simple keyword matching
            text = f"{report['title']} {report['summary']}".lower()
            if any(word in text for word in query_lower.split()):
                results.append({
                    **report,
                    'similarity_score': 0.5  # Placeholder score
                })
        
        return results[:limit]

