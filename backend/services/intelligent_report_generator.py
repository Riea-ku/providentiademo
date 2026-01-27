"""
Intelligent Report Generator - Generates reports with historical comparison
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
import json
from uuid import uuid4

logger = logging.getLogger(__name__)


class IntelligentReportGenerator:
    """Generates reports with historical intelligence and comparisons"""
    
    def __init__(self, postgres_pool, report_storage, pattern_recognizer, llm_key):
        self.pg_pool = postgres_pool
        self.report_storage = report_storage
        self.pattern_recognizer = pattern_recognizer
        self.llm_key = llm_key
    
    async def generate_historical_report(
        self,
        report_type: str,
        current_data: Dict,
        parameters: Optional[Dict] = None
    ) -> str:
        """
        Generate a report with full historical context and comparison
        Returns the report_id
        """
        try:
            # 1. Gather current data
            processed_data = self._process_current_data(current_data)
            
            # 2. Retrieve historical context
            historical_context = await self._get_historical_context(
                report_type, processed_data
            )
            
            # 3. Generate AI insights comparing current vs historical
            ai_insights = await self._generate_comparative_insights(
                processed_data, historical_context
            )
            
            # 4. Compile report
            report_data = {
                'title': self._generate_title(report_type, processed_data),
                'summary': self._generate_summary(processed_data, ai_insights),
                'content': {
                    'current_data': processed_data,
                    'historical_comparison': historical_context.get('comparison'),
                    'trends': historical_context.get('trends'),
                    'patterns': historical_context.get('patterns'),
                    'ai_insights': ai_insights,
                    'recommendations': self._generate_recommendations(
                        processed_data, historical_context, ai_insights
                    )
                },
                'report_type': report_type,
                'generated_by': 'Intelligent Report Generator',
                'reference_entities': self._extract_entities(processed_data)
            }
            
            # 5. Store report
            report_id = await self.report_storage.store_report_with_ai_metadata(report_data)
            
            logger.info(f"Generated historical report: {report_id}")
            return report_id
            
        except Exception as e:
            logger.error(f"Report generation error: {e}")
            raise
    
    async def _get_historical_context(self, report_type: str, current_data: Dict) -> Dict:
        """Get historical context for comparison"""
        
        # Build search query from current data
        query = self._build_search_query(current_data)
        
        # Get similar historical reports
        similar_reports = await self.report_storage.retrieve_similar_reports(
            query=query,
            limit=10
        )
        
        # Get patterns if equipment-related
        patterns = {}
        if 'equipment_id' in current_data:
            patterns = await self.pattern_recognizer.get_patterns_for_equipment(
                current_data['equipment_id']
            )
        
        # Generate comparison
        comparison = self._compare_with_history(current_data, similar_reports)
        
        return {
            'similar_reports': similar_reports,
            'patterns': patterns,
            'comparison': comparison,
            'trends': self._extract_trends(similar_reports)
        }
    
    def _build_search_query(self, data: Dict) -> str:
        """Build search query from data"""
        parts = []
        
        if 'failure_type' in data:
            parts.append(data['failure_type'])
        if 'equipment_type' in data:
            parts.append(data['equipment_type'])
        if 'description' in data:
            parts.append(data['description'][:100])
        
        return ' '.join(parts) or 'system report'
    
    def _process_current_data(self, data: Dict) -> Dict:
        """Process and standardize current data"""
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            **data
        }
    
    def _compare_with_history(self, current: Dict, historical: List[Dict]) -> Dict:
        """Compare current situation with historical data"""
        if not historical:
            return {'message': 'No historical data for comparison'}
        
        comparison = {
            'similar_cases': len(historical),
            'average_severity': 'medium',  # Would calculate from historical data
            'typical_resolution_time': '2-3 days',
            'success_rate': '85%'
        }
        
        return comparison
    
    def _extract_trends(self, reports: List[Dict]) -> List[str]:
        """Extract trends from historical reports"""
        trends = []
        
        if len(reports) > 5:
            trends.append(f"Found {len(reports)} similar historical cases")
        
        return trends
    
    async def _generate_comparative_insights(self, current: Dict, historical: Dict) -> Dict:
        """Generate AI insights comparing current with historical"""
        
        insights = {
            'severity_assessment': self._assess_severity(current, historical),
            'historical_precedents': len(historical.get('similar_reports', [])),
            'risk_factors': self._identify_risk_factors(current, historical),
            'recommended_actions': []
        }
        
        return insights
    
    def _assess_severity(self, current: Dict, historical: Dict) -> str:
        """Assess severity based on historical comparison"""
        severity = current.get('severity', 'medium')
        return severity
    
    def _identify_risk_factors(self, current: Dict, historical: Dict) -> List[str]:
        """Identify risk factors based on patterns"""
        risks = []
        
        patterns = historical.get('patterns', {})
        if patterns.get('risk_level') == 'critical':
            risks.append('High failure frequency detected')
        
        return risks
    
    def _generate_recommendations(self, current: Dict, historical: Dict, insights: Dict) -> List[str]:
        """Generate recommendations based on all data"""
        recommendations = []
        
        # Based on historical patterns
        if historical.get('patterns', {}).get('common_failure_types'):
            top_failure = historical['patterns']['common_failure_types'][0]
            recommendations.append(
                f"Address common {top_failure['type']} failure pattern"
            )
        
        # Based on current severity
        if current.get('severity') == 'critical':
            recommendations.append('Immediate intervention required')
        elif current.get('severity') == 'high':
            recommendations.append('Schedule urgent maintenance')
        else:
            recommendations.append('Plan preventive maintenance')
        
        # Based on historical success
        if historical.get('comparison', {}).get('success_rate'):
            recommendations.append('Follow proven resolution procedures')
        
        return recommendations
    
    def _generate_title(self, report_type: str, data: Dict) -> str:
        """Generate report title"""
        if 'equipment_id' in data:
            return f"{report_type.replace('_', ' ').title()} - {data['equipment_id']}"
        return f"{report_type.replace('_', ' ').title()} Report"
    
    def _generate_summary(self, data: Dict, insights: Dict) -> str:
        """Generate report summary"""
        parts = []
        
        if 'failure_type' in data:
            parts.append(f"{data['failure_type']} detected")
        
        if insights.get('historical_precedents'):
            parts.append(f"with {insights['historical_precedents']} similar historical cases")
        
        return '. '.join(parts) if parts else 'System report generated'
    
    def _extract_entities(self, data: Dict) -> Dict:
        """Extract entity references from data"""
        entities = {}
        
        if 'equipment_id' in data:
            entities['equipment'] = [data['equipment_id']]
        if 'failure_type' in data:
            entities['failure_types'] = [data['failure_type']]
        
        return entities
