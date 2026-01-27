"""
Global Event Orchestrator
Coordinates ALL system interactions with historical tracking
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid
from report_storage_service import ReportStorageService


class GlobalEventOrchestrator:
    """
    Coordinates ALL system interactions with historical tracking
    
    Every significant event in the system flows through this orchestrator:
    - Predictions created
    - Analytics generated
    - Reports created
    - Work orders assigned
    - Technicians dispatched
    - Equipment status changes
    """
    
    def __init__(self, db_client, report_storage: ReportStorageService):
        self.db = db_client
        self.report_storage = report_storage
        self.events_collection = self.db.system_events
        self.historical_context_collection = self.db.historical_context
    
    async def handle_system_event(
        self, 
        event_type: str, 
        data: Dict, 
        user_context: Dict = None
    ) -> Dict:
        """
        Main entry point for all system events
        
        Args:
            event_type: Type of event (prediction, analytics, report, dispatch, etc.)
            data: Event data
            user_context: Optional user context
        
        Returns:
            Event processing result with historical context
        """
        
        # 1. Create event record
        event_id = await self.log_event(event_type, data, user_context)
        
        # 2. Update primary databases
        await self.update_primary_databases(event_type, data)
        
        # 3. Retrieve historical context
        historical_context = await self.get_historical_context(event_type, data)
        
        # 4. Trigger connected systems
        await self.trigger_connected_systems(event_type, data, historical_context)
        
        # 5. Generate and store report if significant
        if self.is_reportable_event(event_type):
            await self.generate_auto_report(event_type, data, historical_context)
        
        # 6. Update search indexes
        await self.update_search_indexes(event_type, data)
        
        return {
            'event_id': event_id,
            'event_type': event_type,
            'status': 'processed',
            'historical_context': historical_context,
            'timestamp': datetime.now().isoformat()
        }
    
    async def log_event(
        self, 
        event_type: str, 
        data: Dict, 
        user_context: Dict = None
    ) -> str:
        """Log event to historical archive"""
        
        event_id = str(uuid.uuid4())
        
        event_record = {
            'id': event_id,
            'event_type': event_type,
            'data': data,
            'user_context': user_context or {},
            'timestamp': datetime.now().isoformat(),
            'processed': True
        }
        
        await self.events_collection.insert_one(event_record)
        
        return event_id
    
    async def update_primary_databases(self, event_type: str, data: Dict):
        """Update appropriate collections based on event type"""
        
        if event_type == 'prediction_created':
            await self.db.predictions_demo.insert_one(data)
        
        elif event_type == 'analytics_generated':
            await self.db.prediction_analytics.insert_one(data)
        
        elif event_type == 'report_generated':
            await self.report_storage.store_report_with_ai_metadata(data)
        
        elif event_type == 'work_order_created':
            await self.db.work_orders.insert_one(data)
        
        elif event_type == 'technician_dispatched':
            await self.db.dispatch_history.insert_one(data)
    
    async def get_historical_context(self, event_type: str, current_data: Dict) -> Dict:
        """
        Retrieve relevant historical data for context
        
        This is the core of the historical intelligence system
        """
        
        # Get similar historical events
        similar_events = await self.query_similar_historical_events(
            event_type=event_type,
            data=current_data,
            lookback_days=365
        )
        
        # Get related reports
        related_reports = await self.get_related_reports(event_type, current_data)
        
        # Get historical outcomes
        outcomes = await self.analyze_historical_outcomes(similar_events)
        
        # Extract patterns
        patterns = await self.extract_patterns(similar_events, related_reports)
        
        # Generate recommendations based on history
        recommendations = await self.generate_historical_recommendations(
            similar_events, 
            related_reports, 
            current_data
        )
        
        return {
            'similar_events': similar_events[:10],  # Top 10 most similar
            'related_reports': related_reports[:5],  # Top 5 reports
            'historical_outcomes': outcomes,
            'patterns': patterns,
            'recommendations_based_on_history': recommendations,
            'total_similar_events': len(similar_events),
            'lookback_period': '365 days'
        }
    
    async def query_similar_historical_events(
        self, 
        event_type: str, 
        data: Dict, 
        lookback_days: int = 365
    ) -> List[Dict]:
        """Query similar historical events"""
        
        # Calculate lookback date
        lookback_date = (datetime.now() - timedelta(days=lookback_days)).isoformat()
        
        # Build query based on event type
        query = {
            'event_type': event_type,
            'timestamp': {'$gte': lookback_date}
        }
        
        # Add specific filters based on data
        if data.get('equipment_id'):
            query['data.equipment_id'] = data['equipment_id']
        
        if data.get('failure_type'):
            query['data.failure_type'] = data['failure_type']
        
        # Get events
        events = await self.events_collection.find(query).sort('timestamp', -1).to_list(50)
        
        return events
    
    async def get_related_reports(self, event_type: str, data: Dict) -> List[Dict]:
        """Get reports related to this event"""
        
        # Generate search query from event data
        search_query = self.generate_query_from_event(event_type, data)
        
        # Search reports
        reports = await self.report_storage.retrieve_similar_reports(
            query=search_query,
            context={'event_type': event_type, 'data': data},
            limit=10
        )
        
        return reports
    
    def generate_query_from_event(self, event_type: str, data: Dict) -> str:
        """Generate search query from event data"""
        
        query_parts = []
        
        # Add event type
        query_parts.append(event_type.replace('_', ' '))
        
        # Add equipment info
        if data.get('equipment_id'):
            query_parts.append(data['equipment_id'])
        
        if data.get('equipment_name'):
            query_parts.append(data['equipment_name'])
        
        # Add failure info
        if data.get('predicted_failure'):
            query_parts.append(data['predicted_failure'])
        
        if data.get('failure_type'):
            query_parts.append(data['failure_type'])
        
        return ' '.join(query_parts)
    
    async def analyze_historical_outcomes(self, events: List[Dict]) -> Dict:
        """Analyze outcomes of historical events"""
        
        outcomes = {
            'total_events': len(events),
            'successful': 0,
            'failed': 0,
            'pending': 0,
            'avg_resolution_time': None,
            'success_rate': 0.0
        }
        
        if not events:
            return outcomes
        
        resolution_times = []
        
        for event in events:
            # Check event outcome
            status = event.get('data', {}).get('status', 'unknown')
            
            if status in ['completed', 'resolved', 'success']:
                outcomes['successful'] += 1
            elif status in ['failed', 'error']:
                outcomes['failed'] += 1
            else:
                outcomes['pending'] += 1
            
            # Calculate resolution time if available
            if event.get('data', {}).get('resolved_at'):
                event_time = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                resolved_time = datetime.fromisoformat(event['data']['resolved_at'].replace('Z', '+00:00'))
                resolution_hours = (resolved_time - event_time).total_seconds() / 3600
                resolution_times.append(resolution_hours)
        
        # Calculate success rate
        if outcomes['total_events'] > 0:
            outcomes['success_rate'] = (outcomes['successful'] / outcomes['total_events']) * 100
        
        # Calculate average resolution time
        if resolution_times:
            outcomes['avg_resolution_time'] = sum(resolution_times) / len(resolution_times)
        
        return outcomes
    
    async def extract_patterns(
        self, 
        events: List[Dict], 
        reports: List[Dict]
    ) -> Dict:
        """Extract patterns from historical events and reports"""
        
        patterns = {
            'common_failure_types': {},
            'frequent_equipment': {},
            'peak_failure_times': {},
            'successful_resolutions': []
        }
        
        # Analyze events
        for event in events:
            data = event.get('data', {})
            
            # Count failure types
            failure_type = data.get('predicted_failure') or data.get('failure_type')
            if failure_type:
                patterns['common_failure_types'][failure_type] = \
                    patterns['common_failure_types'].get(failure_type, 0) + 1
            
            # Count equipment
            equipment_id = data.get('equipment_id')
            if equipment_id:
                patterns['frequent_equipment'][equipment_id] = \
                    patterns['frequent_equipment'].get(equipment_id, 0) + 1
            
            # Track successful resolutions
            if data.get('status') in ['completed', 'resolved', 'success']:
                if data.get('resolution_method'):
                    patterns['successful_resolutions'].append({
                        'method': data['resolution_method'],
                        'failure_type': failure_type,
                        'equipment_id': equipment_id
                    })
        
        # Sort patterns
        patterns['common_failure_types'] = dict(
            sorted(patterns['common_failure_types'].items(), key=lambda x: x[1], reverse=True)[:5]
        )
        patterns['frequent_equipment'] = dict(
            sorted(patterns['frequent_equipment'].items(), key=lambda x: x[1], reverse=True)[:5]
        )
        
        return patterns
    
    async def generate_historical_recommendations(
        self, 
        similar_events: List[Dict],
        related_reports: List[Dict],
        current_data: Dict
    ) -> List[str]:
        """Generate recommendations based on historical data"""
        
        recommendations = []
        
        # Analyze similar events
        if len(similar_events) > 0:
            # Check success rate
            successful = sum(1 for e in similar_events 
                           if e.get('data', {}).get('status') in ['completed', 'resolved', 'success'])
            success_rate = (successful / len(similar_events)) * 100
            
            if success_rate > 70:
                recommendations.append(
                    f"Historical data shows {success_rate:.0f}% success rate for similar situations"
                )
            elif success_rate < 40:
                recommendations.append(
                    f"Caution: Only {success_rate:.0f}% success rate historically - consider alternative approach"
                )
        
        # Check for common resolutions
        resolutions = {}
        for event in similar_events:
            method = event.get('data', {}).get('resolution_method')
            if method:
                resolutions[method] = resolutions.get(method, 0) + 1
        
        if resolutions:
            most_common = max(resolutions.items(), key=lambda x: x[1])
            recommendations.append(
                f"Most successful approach: {most_common[0]} (used {most_common[1]} times)"
            )
        
        # Check reports for insights
        if related_reports:
            high_confidence_reports = [r for r in related_reports 
                                      if r.get('relevance_score', 0) > 5]
            if high_confidence_reports:
                recommendations.append(
                    f"Found {len(high_confidence_reports)} highly relevant historical reports"
                )
        
        return recommendations[:5]  # Top 5 recommendations
    
    async def trigger_connected_systems(
        self, 
        event_type: str, 
        data: Dict,
        historical_context: Dict
    ):
        """Trigger connected systems based on event"""
        
        # This would trigger various system components
        # For now, we just log the trigger
        
        triggers = []
        
        if event_type == 'prediction_created':
            triggers.append('analytics_generation')
        
        if event_type == 'analytics_generated':
            triggers.append('report_generation')
        
        if event_type == 'report_generated':
            triggers.append('technician_dispatch')
        
        # Log triggers
        if triggers:
            await self.log_event('system_triggers', {
                'original_event': event_type,
                'triggered_systems': triggers,
                'historical_context_used': True
            })
    
    def is_reportable_event(self, event_type: str) -> bool:
        """Check if event should generate a report"""
        
        reportable_events = [
            'prediction_created',
            'analytics_generated',
            'critical_failure_detected',
            'maintenance_completed'
        ]
        
        return event_type in reportable_events
    
    async def generate_auto_report(
        self, 
        event_type: str, 
        data: Dict,
        historical_context: Dict
    ):
        """Auto-generate report for significant events"""
        
        # Create report data
        report_data = {
            'id': str(uuid.uuid4()),
            'report_type': f"auto_{event_type}",
            'event_type': event_type,
            'event_data': data,
            'historical_context': historical_context,
            'executive_summary': f"Automatically generated report for {event_type.replace('_', ' ')}",
            'created_at': datetime.now().isoformat(),
            'auto_generated': True
        }
        
        # Store report
        await self.report_storage.store_report_with_ai_metadata(report_data)
    
    async def update_search_indexes(self, event_type: str, data: Dict):
        """Update search indexes for fast retrieval"""
        
        # This would update various search indexes
        # For MongoDB, we rely on the indexes created on collections
        pass
    
    async def get_event_history(
        self, 
        entity_type: str = None, 
        entity_id: str = None,
        days: int = 30
    ) -> List[Dict]:
        """Get event history for an entity"""
        
        query = {
            'timestamp': {'$gte': (datetime.now() - timedelta(days=days)).isoformat()}
        }
        
        if entity_type and entity_id:
            query[f'data.{entity_type}_id'] = entity_id
        
        events = await self.events_collection.find(query).sort('timestamp', -1).to_list(100)
        
        return events
