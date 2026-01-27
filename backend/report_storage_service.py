"""
Report Storage Service with AI Metadata and Historical Intelligence
Handles storing, retrieving, and enabling AI access to all reports
"""
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage

class ReportStorageService:
    """Stores, retrieves, and enables AI access to all reports with historical context"""
    
    def __init__(self, db_client, llm_key: str):
        self.db = db_client
        self.llm_key = llm_key
        self.reports_collection = self.db.automated_reports
        self.reports_archive_collection = self.db.reports_archive
        self.reports_search_collection = self.db.reports_search_index
    
    async def store_report_with_ai_metadata(self, report_data: Dict) -> str:
        """
        Store report with AI metadata for future retrieval and semantic search
        
        Workflow:
        1. Store in reports collection
        2. Generate AI embeddings (text representation)
        3. Extract entities for linking
        4. Generate AI summary and tags
        5. Create search index entry
        """
        
        # 1. Generate unique ID if not exists
        report_id = report_data.get('id') or str(uuid.uuid4())
        report_data['id'] = report_id
        report_data['created_at'] = report_data.get('created_at', datetime.now().isoformat())
        
        # 2. Generate AI metadata
        ai_metadata = await self.generate_ai_metadata(report_data)
        
        # 3. Extract entities for cross-referencing
        entities = await self.extract_entities(report_data)
        
        # 4. Prepare enhanced report document
        enhanced_report = {
            **report_data,
            'ai_metadata': ai_metadata,
            'reference_entities': entities,
            'accessed_count': 0,
            'last_accessed': None,
            'version': 1,
            'archived': False
        }
        
        # 5. Store in main collection
        await self.reports_collection.update_one(
            {'id': report_id},
            {'$set': enhanced_report},
            upsert=True
        )
        
        # 6. Create search index entry
        await self.create_search_index(report_id, enhanced_report, ai_metadata)
        
        return report_id
    
    async def generate_ai_metadata(self, report_data: Dict) -> Dict:
        """Generate AI-powered metadata for the report"""
        
        # Create searchable text from report
        searchable_text = self.extract_searchable_text(report_data)
        
        # Generate AI summary
        summary = await self.generate_ai_summary(report_data)
        
        # Generate tags using AI
        tags = await self.generate_tags(report_data)
        
        # Generate semantic keywords
        keywords = await self.extract_keywords(searchable_text)
        
        # Create text embedding representation (simplified - in production use proper embeddings)
        embedding_text = f"{summary} {' '.join(tags)} {' '.join(keywords)}"
        
        return {
            'summary': summary,
            'tags': tags,
            'keywords': keywords,
            'embedding_text': embedding_text,
            'generated_at': datetime.now().isoformat(),
            'searchable_text': searchable_text
        }
    
    def extract_searchable_text(self, report_data: Dict) -> str:
        """Extract all searchable text from report"""
        
        parts = []
        
        # Add all text fields
        if report_data.get('report_id'):
            parts.append(report_data['report_id'])
        if report_data.get('executive_summary'):
            parts.append(report_data['executive_summary'])
        if report_data.get('equipment_overview'):
            parts.append(report_data['equipment_overview'])
        if report_data.get('failure_analysis'):
            parts.append(report_data['failure_analysis'])
        if report_data.get('impact_assessment'):
            parts.append(report_data['impact_assessment'])
        
        # Add recommendations
        if report_data.get('recommended_actions'):
            parts.extend(report_data['recommended_actions'])
        
        # Add safety instructions
        if report_data.get('safety_instructions'):
            parts.extend(report_data['safety_instructions'])
        
        return ' '.join(parts)
    
    async def generate_ai_summary(self, report_data: Dict) -> str:
        """Generate AI-powered summary of the report"""
        
        try:
            # Create prompt for summary
            report_text = self.extract_searchable_text(report_data)
            
            if not report_text or len(report_text) < 50:
                return report_data.get('executive_summary', 'No summary available')[:200]
            
            # Use AI to generate concise summary
            chat = LlmChat(api_key=self.llm_key, model="claude-sonnet-4-20250514")
            
            prompt = f"""Generate a concise 2-sentence summary of this maintenance report:

{report_text[:1000]}

Summary (2 sentences max):"""
            
            response = await asyncio.to_thread(
                chat.send_message,
                UserMessage(text=prompt)
            )
            
            summary = response.text.strip()[:300]
            return summary
            
        except Exception as e:
            # Fallback to executive summary
            return report_data.get('executive_summary', 'Error generating summary')[:200]
    
    async def generate_tags(self, report_data: Dict) -> List[str]:
        """Generate relevant tags for the report"""
        
        tags = []
        
        # Add equipment-based tags
        if report_data.get('equipment_id'):
            tags.append(f"equipment_{report_data['equipment_id']}")
        
        # Add failure type tags
        if report_data.get('failure_analysis'):
            failure_text = report_data['failure_analysis'].lower()
            if 'bearing' in failure_text:
                tags.append('bearing_failure')
            if 'motor' in failure_text:
                tags.append('motor_issue')
            if 'pump' in failure_text:
                tags.append('pump_failure')
            if 'overheat' in failure_text:
                tags.append('overheating')
            if 'cavitation' in failure_text:
                tags.append('cavitation')
        
        # Add priority tags
        if report_data.get('priority'):
            tags.append(f"priority_{report_data['priority']}")
        
        # Add status tags
        if report_data.get('status'):
            tags.append(f"status_{report_data['status']}")
        
        # Add timestamp tags
        created_at = report_data.get('created_at', datetime.now().isoformat())
        if isinstance(created_at, str):
            date_obj = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        else:
            date_obj = created_at
        
        tags.append(f"year_{date_obj.year}")
        tags.append(f"month_{date_obj.month}")
        
        return list(set(tags))  # Remove duplicates
    
    async def extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text"""
        
        # Simple keyword extraction (in production, use NLP)
        keywords = []
        
        important_terms = [
            'failure', 'maintenance', 'repair', 'urgent', 'critical',
            'bearing', 'motor', 'pump', 'sensor', 'temperature',
            'pressure', 'vibration', 'wear', 'leak', 'damage',
            'preventive', 'corrective', 'emergency', 'scheduled'
        ]
        
        text_lower = text.lower()
        for term in important_terms:
            if term in text_lower:
                keywords.append(term)
        
        return keywords[:10]  # Limit to top 10
    
    async def extract_entities(self, report_data: Dict) -> Dict:
        """Extract entity references for linking"""
        
        entities = {
            'equipment_ids': [],
            'prediction_ids': [],
            'work_order_ids': [],
            'technician_ids': []
        }
        
        # Extract equipment IDs
        if report_data.get('equipment_id'):
            entities['equipment_ids'].append(report_data['equipment_id'])
        
        # Extract prediction IDs
        if report_data.get('prediction_id'):
            entities['prediction_ids'].append(report_data['prediction_id'])
        
        if report_data.get('analytics_id'):
            entities['prediction_ids'].append(report_data['analytics_id'])
        
        # Extract work order IDs
        if report_data.get('work_order_id'):
            entities['work_order_ids'].append(report_data['work_order_id'])
        
        # Extract technician IDs
        if report_data.get('assigned_technician_id'):
            entities['technician_ids'].append(report_data['assigned_technician_id'])
        
        return entities
    
    async def create_search_index(self, report_id: str, report_data: Dict, ai_metadata: Dict):
        """Create search index entry for fast text search"""
        
        search_entry = {
            'report_id': report_id,
            'searchable_text': ai_metadata['searchable_text'],
            'embedding_text': ai_metadata['embedding_text'],
            'tags': ai_metadata['tags'],
            'keywords': ai_metadata['keywords'],
            'created_at': report_data['created_at'],
            'indexed_at': datetime.now().isoformat()
        }
        
        await self.reports_search_collection.update_one(
            {'report_id': report_id},
            {'$set': search_entry},
            upsert=True
        )
    
    async def retrieve_similar_reports(
        self, 
        query: str, 
        context: Dict = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        AI-powered report retrieval with semantic search
        
        Args:
            query: Search query string
            context: Optional context for filtering
            limit: Maximum number of results
        
        Returns:
            List of relevant reports with relevance scores
        """
        
        # 1. Text-based search using MongoDB text search
        search_results = await self.text_search(query, limit * 2)
        
        # 2. Context-aware filtering
        if context:
            search_results = await self.filter_by_context(search_results, context)
        
        # 3. Rank by relevance
        ranked_results = await self.rank_by_relevance(search_results, query)
        
        # 4. Enrich with AI insights
        enriched_results = await self.enrich_with_ai_insights(ranked_results[:limit], query)
        
        # 5. Track access for learning
        await self.track_report_access(enriched_results, query)
        
        return enriched_results
    
    async def text_search(self, query: str, limit: int) -> List[Dict]:
        """Perform text search across indexed reports"""
        
        # Search in search index collection
        search_query = {
            '$or': [
                {'searchable_text': {'$regex': query, '$options': 'i'}},
                {'tags': {'$in': query.lower().split()}},
                {'keywords': {'$in': query.lower().split()}}
            ]
        }
        
        search_results = await self.reports_search_collection.find(
            search_query
        ).limit(limit).to_list(limit)
        
        # Get full reports
        report_ids = [result['report_id'] for result in search_results]
        
        reports = await self.reports_collection.find(
            {'id': {'$in': report_ids}}
        ).to_list(limit)
        
        return reports
    
    async def filter_by_context(self, reports: List[Dict], context: Dict) -> List[Dict]:
        """Filter reports based on context"""
        
        filtered = []
        
        for report in reports:
            # Filter by equipment
            if context.get('equipment_id'):
                if report.get('equipment_id') != context['equipment_id']:
                    continue
            
            # Filter by date range
            if context.get('date_range'):
                report_date = datetime.fromisoformat(report['created_at'].replace('Z', '+00:00'))
                if context['date_range'].get('start'):
                    if report_date < context['date_range']['start']:
                        continue
                if context['date_range'].get('end'):
                    if report_date > context['date_range']['end']:
                        continue
            
            filtered.append(report)
        
        return filtered
    
    async def rank_by_relevance(self, reports: List[Dict], query: str) -> List[Dict]:
        """Rank reports by relevance to query"""
        
        query_terms = set(query.lower().split())
        
        for report in reports:
            score = 0
            
            # Check searchable text
            if report.get('ai_metadata', {}).get('searchable_text'):
                text = report['ai_metadata']['searchable_text'].lower()
                for term in query_terms:
                    score += text.count(term) * 2
            
            # Check tags
            if report.get('ai_metadata', {}).get('tags'):
                matching_tags = query_terms.intersection(set(report['ai_metadata']['tags']))
                score += len(matching_tags) * 5
            
            # Check keywords
            if report.get('ai_metadata', {}).get('keywords'):
                matching_keywords = query_terms.intersection(set(report['ai_metadata']['keywords']))
                score += len(matching_keywords) * 3
            
            # Boost recent reports
            if report.get('created_at'):
                date_obj = datetime.fromisoformat(report['created_at'].replace('Z', '+00:00'))
                days_old = (datetime.now() - date_obj.replace(tzinfo=None)).days
                recency_score = max(0, 10 - (days_old / 30))
                score += recency_score
            
            report['relevance_score'] = score
        
        # Sort by relevance
        reports.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        
        return reports
    
    async def enrich_with_ai_insights(self, reports: List[Dict], query: str) -> List[Dict]:
        """Enrich reports with AI-generated insights"""
        
        for report in reports:
            # Add AI insight about why this report is relevant
            report['ai_insight'] = self.generate_relevance_insight(report, query)
        
        return reports
    
    def generate_relevance_insight(self, report: Dict, query: str) -> str:
        """Generate insight about why report is relevant"""
        
        insights = []
        
        # Check for matching tags
        if report.get('ai_metadata', {}).get('tags'):
            query_terms = set(query.lower().split())
            matching_tags = [tag for tag in report['ai_metadata']['tags'] if any(term in tag for term in query_terms)]
            if matching_tags:
                insights.append(f"Matches: {', '.join(matching_tags[:3])}")
        
        # Add date context
        if report.get('created_at'):
            date_obj = datetime.fromisoformat(report['created_at'].replace('Z', '+00:00'))
            days_old = (datetime.now() - date_obj.replace(tzinfo=None)).days
            if days_old < 7:
                insights.append("Recent report")
            elif days_old < 30:
                insights.append(f"{days_old} days ago")
        
        # Add relevance score
        if report.get('relevance_score'):
            insights.append(f"Relevance: {report['relevance_score']:.1f}")
        
        return " | ".join(insights) if insights else "Relevant to your query"
    
    async def track_report_access(self, reports: List[Dict], query: str):
        """Track report access for learning"""
        
        report_ids = [r['id'] for r in reports if r.get('id')]
        
        if report_ids:
            await self.reports_collection.update_many(
                {'id': {'$in': report_ids}},
                {
                    '$inc': {'accessed_count': 1},
                    '$set': {'last_accessed': datetime.now().isoformat()}
                }
            )
    
    async def get_report_history_for_entity(
        self, 
        entity_type: str, 
        entity_id: str
    ) -> List[Dict]:
        """Get all reports related to specific equipment, prediction, etc."""
        
        query = {}
        
        if entity_type == 'equipment':
            query = {'reference_entities.equipment_ids': entity_id}
        elif entity_type == 'prediction':
            query = {'reference_entities.prediction_ids': entity_id}
        elif entity_type == 'work_order':
            query = {'reference_entities.work_order_ids': entity_id}
        elif entity_type == 'technician':
            query = {'reference_entities.technician_ids': entity_id}
        
        reports = await self.reports_collection.find(query).sort('created_at', -1).to_list(100)
        
        return reports
    
    async def archive_report(self, report_id: str, reason: str = None, archived_by: str = None):
        """Archive a report (keep in history but mark as archived)"""
        
        # Get original report
        report = await self.reports_collection.find_one({'id': report_id})
        
        if not report:
            return False
        
        # Create archive entry
        archive_entry = {
            'id': str(uuid.uuid4()),
            'original_report_id': report_id,
            'version': report.get('version', 1),
            'report_data': report,
            'archived_at': datetime.now().isoformat(),
            'archived_by': archived_by,
            'archive_reason': reason
        }
        
        await self.reports_archive_collection.insert_one(archive_entry)
        
        # Mark report as archived
        await self.reports_collection.update_one(
            {'id': report_id},
            {'$set': {'archived': True, 'archived_at': datetime.now().isoformat()}}
        )
        
        return True
