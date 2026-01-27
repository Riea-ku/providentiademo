"""
Historical AI Chatbot with Citation Capabilities
AI that knows everything that ever happened in the system
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
from report_storage_service import ReportStorageService
from event_orchestrator import GlobalEventOrchestrator


class HistoricalAwareChatbot:
    """
    AI chatbot with complete historical awareness
    Can reference past reports, events, and patterns
    Provides citations to sources
    """
    
    def __init__(
        self, 
        db_client,
        llm_key: str,
        report_storage: ReportStorageService,
        event_orchestrator: GlobalEventOrchestrator
    ):
        self.db = db_client
        self.llm_key = llm_key
        self.report_storage = report_storage
        self.event_orchestrator = event_orchestrator
        self.conversations_collection = self.db.chatbot_conversations
    
    async def process_message_with_history(
        self, 
        message: str, 
        session_id: str,
        user_context: Dict = None
    ) -> Dict:
        """
        Process message with full historical awareness
        
        Returns:
            {
                'content': str,  # Response text
                'citations': List[Dict],  # Citations to historical data
                'historical_references': List[Dict],  # Referenced events/reports
                'confidence': float,  # Confidence in response
                'updated_historical_context': Dict  # Historical context used
            }
        """
        
        # 1. Get current system state
        current_state = await self.get_current_system_state()
        
        # 2. Retrieve relevant historical context
        historical_context = await self.retrieve_relevant_history(
            message, 
            current_state, 
            user_context
        )
        
        # 3. Analyze intent with historical perspective
        intent = await self.analyze_intent_with_history(
            message, 
            current_state, 
            historical_context
        )
        
        # 4. Get conversation history
        conversation_history = await self.get_conversation_history(session_id)
        
        # 5. Generate response with historical references
        response = await self.generate_historically_informed_response(
            message=message,
            current_state=current_state,
            historical_context=historical_context,
            intent=intent,
            conversation_history=conversation_history
        )
        
        # 6. Add citations
        response_with_citations = self.add_historical_citations(
            response, 
            historical_context
        )
        
        # 7. Log interaction
        await self.log_historical_interaction(
            session_id=session_id,
            message=message,
            response=response_with_citations,
            current_state=current_state,
            historical_context=historical_context,
            intent=intent
        )
        
        return response_with_citations
    
    async def get_current_system_state(self) -> Dict:
        """Get current state of the system"""
        
        # Get recent simulations
        recent_simulations = await self.db.ai_simulations.find().sort(
            'started_at', -1
        ).limit(5).to_list(5)
        
        # Get recent predictions
        recent_predictions = await self.db.predictions_demo.find().sort(
            '_id', -1
        ).limit(5).to_list(5)
        
        # Get active work orders
        active_work_orders = await self.db.work_orders.find(
            {'status': {'$in': ['pending', 'in_progress']}}
        ).to_list(10)
        
        return {
            'recent_simulations': recent_simulations,
            'recent_predictions': recent_predictions,
            'active_work_orders': active_work_orders,
            'timestamp': datetime.now().isoformat()
        }
    
    async def retrieve_relevant_history(
        self, 
        query: str, 
        current_state: Dict,
        user_context: Dict = None
    ) -> Dict:
        """Retrieve all relevant historical data"""
        
        # 1. Semantic search through all reports
        relevant_reports = await self.report_storage.retrieve_similar_reports(
            query=query,
            context={**current_state, **(user_context or {})},
            limit=5
        )
        
        # 2. Get similar past events
        similar_events = await self.event_orchestrator.get_event_history(days=90)
        
        # Filter events relevant to query
        relevant_events = self.filter_relevant_events(similar_events, query)
        
        # 3. Extract historical patterns
        patterns = await self.extract_historical_patterns(query, current_state)
        
        # 4. Get past decisions and outcomes
        past_decisions = await self.get_past_decisions(query, current_state)
        
        # 5. Calculate historical success rates
        success_rates = await self.calculate_historical_success_rates(query, current_state)
        
        # 6. Analyze trends
        trends = await self.analyze_historical_trends(query, current_state)
        
        return {
            'relevant_reports': relevant_reports,
            'similar_past_events': relevant_events[:10],
            'patterns': patterns,
            'past_decisions': past_decisions,
            'historical_success_rates': success_rates,
            'trends': trends
        }
    
    def filter_relevant_events(self, events: List[Dict], query: str) -> List[Dict]:
        """Filter events relevant to query"""
        
        query_terms = set(query.lower().split())
        relevant = []
        
        for event in events:
            # Check event type
            event_type = event.get('event_type', '').lower()
            if any(term in event_type for term in query_terms):
                relevant.append(event)
                continue
            
            # Check event data
            event_data = str(event.get('data', {})).lower()
            if any(term in event_data for term in query_terms):
                relevant.append(event)
        
        return relevant
    
    async def extract_historical_patterns(self, query: str, current_state: Dict) -> Dict:
        """Extract patterns from historical data"""
        
        # Get all events from last 365 days
        all_events = await self.event_orchestrator.get_event_history(days=365)
        
        # Extract patterns
        patterns = {
            'failure_frequency': {},
            'success_patterns': [],
            'common_issues': []
        }
        
        for event in all_events:
            event_type = event.get('event_type')
            data = event.get('data', {})
            
            # Track failure frequencies
            if 'failure' in event_type:
                failure_type = data.get('predicted_failure') or data.get('failure_type', 'unknown')
                patterns['failure_frequency'][failure_type] = \
                    patterns['failure_frequency'].get(failure_type, 0) + 1
            
            # Track successful resolutions
            if data.get('status') in ['completed', 'resolved', 'success']:
                patterns['success_patterns'].append({
                    'event_type': event_type,
                    'method': data.get('resolution_method'),
                    'timestamp': event.get('timestamp')
                })
        
        return patterns
    
    async def get_past_decisions(self, query: str, current_state: Dict) -> List[Dict]:
        """Get past decisions and their outcomes"""
        
        # Get dispatch history
        dispatches = await self.db.dispatch_history.find().sort('_id', -1).limit(20).to_list(20)
        
        decisions = []
        for dispatch in dispatches:
            decisions.append({
                'type': 'technician_dispatch',
                'decision': f"Assigned {dispatch.get('assigned_technician_id')} to {dispatch.get('equipment_id')}",
                'outcome': dispatch.get('status', 'unknown'),
                'timestamp': dispatch.get('created_at')
            })
        
        return decisions[:10]
    
    async def calculate_historical_success_rates(
        self, 
        query: str, 
        current_state: Dict
    ) -> Dict:
        """Calculate historical success rates for various operations"""
        
        # Get simulation history
        simulations = await self.db.ai_simulations.find().to_list(100)
        
        success_rates = {
            'simulations': {
                'total': len(simulations),
                'successful': sum(1 for s in simulations if s.get('status') == 'complete'),
                'rate': 0.0
            }
        }
        
        if success_rates['simulations']['total'] > 0:
            success_rates['simulations']['rate'] = (
                success_rates['simulations']['successful'] / 
                success_rates['simulations']['total']
            ) * 100
        
        return success_rates
    
    async def analyze_historical_trends(self, query: str, current_state: Dict) -> Dict:
        """Analyze trends over time"""
        
        # Get events from last 90 days
        events = await self.event_orchestrator.get_event_history(days=90)
        
        # Group by month
        monthly_counts = {}
        for event in events:
            timestamp = event.get('timestamp', '')
            if timestamp:
                month = timestamp[:7]  # YYYY-MM
                monthly_counts[month] = monthly_counts.get(month, 0) + 1
        
        trends = {
            'monthly_event_counts': monthly_counts,
            'trend_direction': 'stable'
        }
        
        # Determine trend direction
        months = sorted(monthly_counts.keys())
        if len(months) >= 2:
            recent = monthly_counts[months[-1]]
            previous = monthly_counts[months[-2]]
            if recent > previous * 1.2:
                trends['trend_direction'] = 'increasing'
            elif recent < previous * 0.8:
                trends['trend_direction'] = 'decreasing'
        
        return trends
    
    async def analyze_intent_with_history(
        self, 
        message: str, 
        current_state: Dict,
        historical_context: Dict
    ) -> Dict:
        """Analyze user intent considering historical context"""
        
        message_lower = message.lower()
        
        intent = {
            'type': 'general_query',
            'entities': [],
            'requires_historical_data': False,
            'confidence': 0.5
        }
        
        # Check for report-related queries
        if any(word in message_lower for word in ['report', 'reports', 'documentation']):
            intent['type'] = 'retrieve_report'
            intent['requires_historical_data'] = True
            intent['confidence'] = 0.8
        
        # Check for comparison queries
        if any(word in message_lower for word in ['compare', 'comparison', 'versus', 'vs']):
            intent['type'] = 'compare_reports'
            intent['requires_historical_data'] = True
            intent['confidence'] = 0.9
        
        # Check for trend queries
        if any(word in message_lower for word in ['trend', 'pattern', 'over time', 'history']):
            intent['type'] = 'trend_analysis'
            intent['requires_historical_data'] = True
            intent['confidence'] = 0.85
        
        # Extract entities (equipment IDs, failure types, etc.)
        if 'pump' in message_lower:
            intent['entities'].append({'type': 'equipment', 'value': 'pump'})
        if 'bearing' in message_lower:
            intent['entities'].append({'type': 'failure_type', 'value': 'bearing'})
        if 'motor' in message_lower:
            intent['entities'].append({'type': 'equipment_part', 'value': 'motor'})
        
        return intent
    
    async def generate_historically_informed_response(
        self,
        message: str,
        current_state: Dict,
        historical_context: Dict,
        intent: Dict,
        conversation_history: List[Dict]
    ) -> str:
        """Generate response using historical context"""
        
        # Build context for LLM
        context_parts = []
        
        # Add current state summary
        context_parts.append("**Current System State:**")
        context_parts.append(f"- Recent simulations: {len(current_state.get('recent_simulations', []))}")
        context_parts.append(f"- Active work orders: {len(current_state.get('active_work_orders', []))}")
        
        # Add historical context
        if historical_context.get('relevant_reports'):
            context_parts.append("\n**Historical Reports Found:**")
            for i, report in enumerate(historical_context['relevant_reports'][:3], 1):
                summary = report.get('ai_metadata', {}).get('summary', 'No summary available')[:100]
                context_parts.append(f"{i}. {summary}...")
        
        if historical_context.get('patterns'):
            context_parts.append("\n**Historical Patterns:**")
            patterns = historical_context['patterns']
            if patterns.get('failure_frequency'):
                top_failure = max(patterns['failure_frequency'].items(), key=lambda x: x[1], default=('None', 0))
                context_parts.append(f"- Most common failure: {top_failure[0]} ({top_failure[1]} times)")
        
        if historical_context.get('historical_success_rates'):
            rates = historical_context['historical_success_rates']
            if rates.get('simulations'):
                context_parts.append(f"\n**Success Rate:** {rates['simulations']['rate']:.1f}%")
        
        # Create prompt for LLM
        context_text = "\n".join(context_parts)
        
        prompt = f"""You are Vida AI, an intelligent assistant for predictive maintenance.

{context_text}

**User Question:** {message}

**Intent Analysis:** {intent['type']}

Provide a helpful, informative response that:
1. Directly answers the user's question
2. References relevant historical data when appropriate
3. Provides actionable insights
4. Keeps response concise (2-3 paragraphs maximum)

Response:"""
        
        try:
            # Generate response with AI
            chat = LlmChat(api_key=self.llm_key, model="claude-sonnet-4-20250514")
            
            response = await asyncio.to_thread(
                chat.send_message,
                UserMessage(text=prompt)
            )
            
            return response.text.strip()
            
        except Exception as e:
            # Fallback response
            return self.generate_fallback_response(message, historical_context)
    
    def generate_fallback_response(self, message: str, historical_context: Dict) -> str:
        """Generate fallback response if AI fails"""
        
        response_parts = []
        
        response_parts.append(f"I found some relevant information about your query: '{message}'")
        
        if historical_context.get('relevant_reports'):
            response_parts.append(
                f"\nFound {len(historical_context['relevant_reports'])} relevant historical reports."
            )
        
        if historical_context.get('similar_past_events'):
            response_parts.append(
                f"Identified {len(historical_context['similar_past_events'])} similar past events."
            )
        
        response_parts.append("\nHow can I help you further with this information?")
        
        return " ".join(response_parts)
    
    def add_historical_citations(
        self, 
        response: str, 
        historical_context: Dict
    ) -> Dict:
        """Add citations and historical references to response"""
        
        citations = []
        
        # Add report citations
        if historical_context.get('relevant_reports'):
            for report in historical_context['relevant_reports'][:3]:
                citations.append({
                    'type': 'report',
                    'report_id': report.get('id'),
                    'title': report.get('report_id', 'Unknown Report'),
                    'created_at': report.get('created_at'),
                    'relevance_score': report.get('relevance_score', 0),
                    'summary': report.get('ai_metadata', {}).get('summary', '')[:100]
                })
        
        # Add event citations
        if historical_context.get('similar_past_events'):
            for event in historical_context['similar_past_events'][:3]:
                citations.append({
                    'type': 'event',
                    'event_id': event.get('id'),
                    'event_type': event.get('event_type'),
                    'timestamp': event.get('timestamp')
                })
        
        return {
            'content': response,
            'citations': citations,
            'historical_references': {
                'reports_used': len(historical_context.get('relevant_reports', [])),
                'events_used': len(historical_context.get('similar_past_events', [])),
                'patterns_analyzed': bool(historical_context.get('patterns'))
            },
            'confidence': 0.85 if citations else 0.6,
            'updated_historical_context': historical_context
        }
    
    async def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for context"""
        
        conversation = await self.conversations_collection.find_one({'session_id': session_id})
        
        if conversation:
            return conversation.get('messages', [])
        
        return []
    
    async def log_historical_interaction(
        self,
        session_id: str,
        message: str,
        response: Dict,
        current_state: Dict,
        historical_context: Dict,
        intent: Dict
    ):
        """Log interaction for learning"""
        
        interaction = {
            'session_id': session_id,
            'user_message': message,
            'ai_response': response.get('content'),
            'citations_count': len(response.get('citations', [])),
            'intent': intent,
            'historical_data_used': response.get('historical_references'),
            'timestamp': datetime.now().isoformat()
        }
        
        # Update conversation
        await self.conversations_collection.update_one(
            {'session_id': session_id},
            {
                '$push': {
                    'messages': {
                        'role': 'user',
                        'content': message,
                        'timestamp': datetime.now().isoformat()
                    }
                },
                '$set': {
                    'last_updated': datetime.now().isoformat()
                }
            },
            upsert=True
        )
        
        await self.conversations_collection.update_one(
            {'session_id': session_id},
            {
                '$push': {
                    'messages': {
                        'role': 'assistant',
                        'content': response.get('content'),
                        'citations': response.get('citations', []),
                        'timestamp': datetime.now().isoformat()
                    }
                }
            }
        )
