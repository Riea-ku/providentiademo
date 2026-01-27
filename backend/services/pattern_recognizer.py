"""
Pattern Recognition Service - Identifies patterns in historical data
Now supports MongoDB-only mode when PostgreSQL is unavailable
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
import json
from collections import Counter

logger = logging.getLogger(__name__)


class PatternRecognizerService:
    """Identifies and analyzes patterns across historical data"""
    
    def __init__(self, postgres_pool, mongo_db):
        self.pg_pool = postgres_pool
        self.mongo_db = mongo_db
    
    async def analyze_system_patterns(self, time_period: str = 'all') -> Dict:
        """Analyze patterns across all historical data"""
        
        # If no PostgreSQL, use MongoDB data
        if self.pg_pool is None:
            return await self._analyze_mongo_patterns(time_period)
        
        try:
            # Calculate time range
            days = self._parse_time_period(time_period)
            start_date = datetime.now(timezone.utc) - timedelta(days=days) if days else None
            
            # Get all reports in time range
            async with self.pg_pool.acquire() as conn:
                if start_date:
                    reports = await conn.fetch("""
                        SELECT * FROM reports WHERE created_at >= $1
                        ORDER BY created_at DESC
                    """, start_date)
                else:
                    reports = await conn.fetch("""
                        SELECT * FROM reports ORDER BY created_at DESC
                    """)
            
            # Analyze patterns
            failure_patterns = self._analyze_failure_patterns(reports)
            tag_patterns = self._analyze_tag_patterns(reports)
            temporal_patterns = self._analyze_temporal_patterns(reports)
            
            return {
                'time_period': time_period,
                'total_reports': len(reports),
                'failure_patterns': failure_patterns,
                'tag_patterns': tag_patterns,
                'temporal_patterns': temporal_patterns,
                'insights': self._generate_insights(failure_patterns, tag_patterns, temporal_patterns)
            }
            
        except Exception as e:
            logger.error(f"Pattern analysis error: {e}")
            return {'error': str(e)}
    
    async def _analyze_mongo_patterns(self, time_period: str) -> Dict:
        """Analyze patterns from MongoDB when PostgreSQL unavailable"""
        try:
            # Get work orders and predictions from MongoDB
            work_orders = await self.mongo_db.work_orders.find({}, {"_id": 0}).to_list(500)
            predictions = await self.mongo_db.demo_predictions.find({}, {"_id": 0}).to_list(100)
            
            # Analyze failure patterns from predictions
            failure_types = [p.get('failure_mode', 'unknown') for p in predictions]
            failure_counts = Counter(failure_types)
            
            return {
                'time_period': time_period,
                'total_reports': len(work_orders) + len(predictions),
                'failure_patterns': {
                    'most_common': [{'type': k, 'count': v} for k, v in failure_counts.most_common(5)],
                    'total_failures': len(failure_types),
                    'unique_types': len(failure_counts)
                },
                'tag_patterns': {'most_common_tags': [], 'total_tags': 0},
                'temporal_patterns': {},
                'insights': [f"Found {len(predictions)} predictions across {len(failure_counts)} failure types"]
            }
        except Exception as e:
            logger.error(f"MongoDB pattern analysis error: {e}")
            return {'error': str(e), 'message': 'Pattern analysis unavailable'}
    
    async def get_patterns_for_equipment(self, equipment_id: str) -> Dict:
        """Get historical patterns for specific equipment"""
        
        # If no PostgreSQL, return limited data
        if self.pg_pool is None:
            return {
                'equipment_id': equipment_id,
                'report_count': 0,
                'message': 'Pattern analysis limited (PostgreSQL unavailable)',
                'risk_level': 'unknown'
            }
        
        try:
            # Get equipment reports
            async with self.pg_pool.acquire() as conn:
                reports = await conn.fetch("""
                    SELECT * FROM reports
                    WHERE reference_entities @> $1::jsonb
                    ORDER BY created_at DESC
                """, json.dumps({'equipment': [equipment_id]}))
            
            if not reports:
                return {
                    'equipment_id': equipment_id,
                    'report_count': 0,
                    'message': 'No historical data found'
                }
            
            # Calculate patterns
            failure_frequency = self._calculate_failure_frequency(reports)
            common_failures = self._identify_common_failures(reports)
            
            return {
                'equipment_id': equipment_id,
                'report_count': len(reports),
                'failure_frequency': failure_frequency,
                'common_failure_types': common_failures,
                'last_report': reports[0]['created_at'].isoformat() if reports else None,
                'risk_level': self._assess_risk_level(failure_frequency)
            }
            
        except Exception as e:
            logger.error(f"Equipment pattern error: {e}")
            return {'error': str(e)}
    
    def _parse_time_period(self, period: str) -> Optional[int]:
        """Parse time period string to days"""
        if period == 'all':
            return None
        elif period.endswith('d'):
            return int(period[:-1])
        elif period == '30d':
            return 30
        elif period == '90d':
            return 90
        elif period == '365d':
            return 365
        return 365
    
    def _analyze_failure_patterns(self, reports: List) -> Dict:
        """Analyze failure type patterns"""
        failure_types = []
        
        for report in reports:
            content = json.loads(report['content']) if report['content'] else {}
            if 'failure_type' in content:
                failure_types.append(content['failure_type'])
        
        type_counts = Counter(failure_types)
        
        return {
            'most_common': [{'type': k, 'count': v} for k, v in type_counts.most_common(5)],
            'total_failures': len(failure_types),
            'unique_types': len(type_counts)
        }
    
    def _analyze_tag_patterns(self, reports: List) -> Dict:
        """Analyze tag patterns"""
        all_tags = []
        
        for report in reports:
            tags = report.get('tags', [])
            if tags:
                all_tags.extend(tags)
        
        tag_counts = Counter(all_tags)
        
        return {
            'most_common_tags': [{'tag': k, 'count': v} for k, v in tag_counts.most_common(10)],
            'total_tags': len(all_tags),
            'unique_tags': len(tag_counts)
        }
    
    def _analyze_temporal_patterns(self, reports: List) -> Dict:
        """Analyze temporal patterns"""
        if not reports:
            return {}
        
        # Group by month
        monthly_counts = Counter()
        for report in reports:
            month_key = report['created_at'].strftime('%Y-%m')
            monthly_counts[month_key] += 1
        
        return {
            'reports_by_month': dict(monthly_counts.most_common()),
            'avg_per_month': sum(monthly_counts.values()) / len(monthly_counts) if monthly_counts else 0
        }
    
    def _calculate_failure_frequency(self, reports: List) -> float:
        """Calculate failure frequency (failures per day)"""
        if len(reports) < 2:
            return 0.0
        
        first_date = reports[-1]['created_at']
        last_date = reports[0]['created_at']
        days = (last_date - first_date).days or 1
        
        return len(reports) / days
    
    def _identify_common_failures(self, reports: List) -> List[Dict]:
        """Identify most common failure types"""
        failure_types = []
        
        for report in reports:
            content = json.loads(report['content']) if report['content'] else {}
            if 'failure_type' in content:
                failure_types.append(content['failure_type'])
        
        type_counts = Counter(failure_types)
        return [{'type': k, 'count': v} for k, v in type_counts.most_common(5)]
    
    def _assess_risk_level(self, frequency: float) -> str:
        """Assess risk level based on failure frequency"""
        if frequency > 0.5:  # More than 1 failure every 2 days
            return 'critical'
        elif frequency > 0.2:  # More than 1 failure every 5 days
            return 'high'
        elif frequency > 0.1:  # More than 1 failure every 10 days
            return 'medium'
        else:
            return 'low'
    
    def _generate_insights(self, failure_patterns: Dict, tag_patterns: Dict, temporal_patterns: Dict) -> List[str]:
        """Generate insights from patterns"""
        insights = []
        
        if failure_patterns.get('most_common'):
            top_failure = failure_patterns['most_common'][0]
            insights.append(
                f"Most common failure: {top_failure['type']} ({top_failure['count']} occurrences)"
            )
        
        if temporal_patterns.get('avg_per_month'):
            avg = temporal_patterns['avg_per_month']
            insights.append(f"Average {avg:.1f} reports per month")
        
        return insights
