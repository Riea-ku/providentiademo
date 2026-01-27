"""
Historical AI Chatbot - AI that knows everything that happened in the system
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


class HistoricalAwareChatbot:
    """AI Chatbot with complete historical intelligence and citations"""
    
    def __init__(self, postgres_pool, embedding_service, report_storage_service, llm_key):
        self.pg_pool = postgres_pool
        self.embedding_service = embedding_service
        self.report_storage = report_storage_service
        self.llm_key = llm_key
        # Will be set from server.py
        self.mongo_db = None
    
    def set_mongo_db(self, mongo_db):
        """Set MongoDB instance"""
        self.mongo_db = mongo_db
    
    async def process_message_with_history(
        self,
        message: str,
        session_id: str,
        user_context: Optional[Dict] = None
    ) -> Dict:
        """
        Process user message with full historical awareness
        Returns response with citations to historical reports
        """
        try:
            # 1. Retrieve relevant historical context
            historical_context = await self._retrieve_relevant_history(message, user_context)
            
            # 2. Analyze intent
            intent = self._analyze_intent(message)
            
            # 3. Generate response with historical references
            response = await self._generate_response_with_history(
                message=message,
                historical_context=historical_context,
                intent=intent,
                session_id=session_id
            )
            
            # 4. Store conversation with context
            await self._store_conversation(
                session_id=session_id,
                message=message,
                response=response,
                historical_context=historical_context
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Chatbot processing error: {e}")
            return {
                'content': "I apologize, but I'm having trouble processing your request.",
                'citations': [],
                'historical_references': [],
                'error': str(e)
            }
    
    async def _retrieve_relevant_history(
        self,
        query: str,
        user_context: Optional[Dict] = None
    ) -> Dict:
        """Retrieve all relevant historical data"""
        
        # Analyze query to determine what data to fetch
        query_lower = query.lower()
        
        # Initialize context
        context = {
            'relevant_reports': [],
            'patterns': [],
            'trends': [],
            'real_time_data': {}
        }
        
        # Get real-time data from MongoDB based on query
        if self.mongo_db is not None:
            # Check for inventory queries
            if any(word in query_lower for word in ['inventory', 'stock', 'parts', 'low', 'reorder']):
                context['real_time_data']['inventory'] = await self._get_inventory_data()
            
            # Check for cost queries
            if any(word in query_lower for word in ['cost', 'expense', 'budget', 'money', 'financial']):
                context['real_time_data']['costs'] = await self._get_cost_data()
            
            # Check for equipment queries
            if any(word in query_lower for word in ['equipment', 'machine', 'pump', 'motor', 'status']):
                context['real_time_data']['equipment'] = await self._get_equipment_data()
            
            # Check for work order queries
            if any(word in query_lower for word in ['work order', 'ticket', 'maintenance', 'repair']):
                context['real_time_data']['work_orders'] = await self._get_work_orders()
            
            # Check for prediction queries
            if any(word in query_lower for word in ['predict', 'forecast', 'failure', 'alert']):
                context['real_time_data']['predictions'] = await self._get_predictions()
        
        # Search reports semantically
        reports = await self.report_storage.retrieve_similar_reports(
            query=query,
            context=user_context,
            limit=5
        )
        context['relevant_reports'] = reports
        
        return context
    
    async def _get_inventory_data(self) -> Dict:
        """Get current inventory data"""
        try:
            # Get low stock items
            inventory = await self.mongo_db.inventory.find({}, {"_id": 0}).to_list(100)
            low_stock = [item for item in inventory if item.get('quantity_on_hand', 0) <= item.get('reorder_point', 0)]
            
            return {
                'total_items': len(inventory),
                'low_stock_count': len(low_stock),
                'low_stock_items': low_stock[:10],
                'summary': f"{len(low_stock)} items need reordering out of {len(inventory)} total"
            }
        except Exception as e:
            logger.error(f"Failed to get inventory data: {e}")
            return {}
    
    async def _get_cost_data(self) -> Dict:
        """Get cost breakdown data"""
        try:
            # Get recent work orders with costs
            from datetime import datetime, timedelta, timezone
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            
            work_orders = await self.mongo_db.work_orders.find({
                'created_at': {'$gte': thirty_days_ago.isoformat()}
            }, {"_id": 0}).to_list(1000)
            
            # Calculate costs
            total_cost = sum(float(wo.get('estimated_cost', 0)) for wo in work_orders)
            by_priority = {}
            for wo in work_orders:
                priority = wo.get('priority', 'medium')
                by_priority[priority] = by_priority.get(priority, 0) + float(wo.get('estimated_cost', 0))
            
            return {
                'total_cost': total_cost,
                'work_order_count': len(work_orders),
                'cost_by_priority': by_priority,
                'average_cost': total_cost / len(work_orders) if work_orders else 0,
                'summary': f"Total ${total_cost:,.2f} across {len(work_orders)} work orders this month"
            }
        except Exception as e:
            logger.error(f"Failed to get cost data: {e}")
            return {}
    
    async def _get_equipment_data(self) -> Dict:
        """Get equipment status data"""
        try:
            equipment = await self.mongo_db.equipment.find({}, {"_id": 0}).to_list(1000)
            
            by_status = {}
            for eq in equipment:
                status = eq.get('status', 'unknown')
                by_status[status] = by_status.get(status, 0) + 1
            
            critical = [eq for eq in equipment if eq.get('status') == 'critical']
            
            return {
                'total_equipment': len(equipment),
                'by_status': by_status,
                'critical_equipment': critical[:5],
                'summary': f"{len(equipment)} total equipment: {by_status.get('operational', 0)} operational, {by_status.get('critical', 0)} critical"
            }
        except Exception as e:
            logger.error(f"Failed to get equipment data: {e}")
            return {}
    
    async def _get_work_orders(self) -> Dict:
        """Get work orders data"""
        try:
            work_orders = await self.mongo_db.work_orders.find({}, {"_id": 0}).sort('created_at', -1).to_list(100)
            
            by_status = {}
            for wo in work_orders:
                status = wo.get('status', 'unknown')
                by_status[status] = by_status.get(status, 0) + 1
            
            pending = [wo for wo in work_orders if wo.get('status') in ['pending', 'in_progress']]
            
            return {
                'total': len(work_orders),
                'by_status': by_status,
                'pending_work_orders': pending[:10],
                'summary': f"{len(work_orders)} total work orders: {by_status.get('pending', 0)} pending, {by_status.get('in_progress', 0)} in progress"
            }
        except Exception as e:
            logger.error(f"Failed to get work orders: {e}")
            return {}
    
    async def _get_predictions(self) -> Dict:
        """Get predictions data"""
        try:
            predictions = await self.mongo_db.failure_predictions.find({}, {"_id": 0}).sort('created_at', -1).to_list(50)
            
            high_risk = [p for p in predictions if p.get('severity') in ['critical', 'high']]
            
            return {
                'total_predictions': len(predictions),
                'high_risk_count': len(high_risk),
                'recent_predictions': predictions[:10],
                'high_risk_predictions': high_risk[:5],
                'summary': f"{len(predictions)} predictions, {len(high_risk)} high-risk failures identified"
            }
        except Exception as e:
            logger.error(f"Failed to get predictions: {e}")
            return {}
    
    def _analyze_intent(self, message: str) -> Dict:
        """Analyze user intent from message"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['search', 'find', 'show', 'what']):
            return {'type': 'search', 'confidence': 0.8}
        elif any(word in message_lower for word in ['compare', 'difference', 'versus']):
            return {'type': 'compare', 'confidence': 0.8}
        elif any(word in message_lower for word in ['trend', 'pattern', 'history']):
            return {'type': 'analyze', 'confidence': 0.8}
        else:
            return {'type': 'general', 'confidence': 0.5}
    
    async def _generate_response_with_history(
        self,
        message: str,
        historical_context: Dict,
        intent: Dict,
        session_id: str
    ) -> Dict:
        """Generate AI response with historical references"""
        
        # Build context for LLM
        context_text = self._build_context_text(historical_context)
        
        # Create system message with historical context
        system_message = f"""You are a historically-aware AI assistant for a predictive maintenance system.

You have access to historical reports and system data. When answering questions:
1. Reference specific reports when relevant
2. Cite your sources using [Report: Title]
3. Provide insights based on historical patterns
4. Be specific and actionable

Current Historical Context:
{context_text}

Always provide helpful, accurate responses based on the historical data available."""
        
        # Generate response using LLM
        try:
            chat = LlmChat(
                api_key=self.llm_key,
                session_id=session_id,
                system_message=system_message
            )
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            user_msg = UserMessage(text=message)
            response_text = await chat.send_message(user_msg)
            
            # Extract citations from response
            citations = self._extract_citations(
                response_text,
                historical_context['relevant_reports']
            )
            
            return {
                'content': response_text,
                'citations': citations,
                'historical_references': [
                    {
                        'report_id': r['id'],
                        'title': r['title'],
                        'relevance': r.get('similarity_score', 0)
                    }
                    for r in historical_context['relevant_reports'][:3]
                ]
            }
            
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            # Fallback response
            return {
                'content': self._generate_fallback_response(message, historical_context),
                'citations': [],
                'historical_references': []
            }
    
    def _build_context_text(self, historical_context: Dict) -> str:
        """Build text representation of historical context"""
        context_parts = []
        
        # Add real-time data first
        real_time_data = historical_context.get('real_time_data', {})
        
        if real_time_data.get('inventory'):
            inv = real_time_data['inventory']
            context_parts.append(f"CURRENT INVENTORY STATUS:")
            context_parts.append(f"- {inv.get('summary', 'No data')}")
            if inv.get('low_stock_items'):
                context_parts.append(f"  Low Stock Items:")
                for item in inv['low_stock_items'][:5]:
                    context_parts.append(f"    • {item.get('name', 'Unknown')}: {item.get('quantity_on_hand', 0)} units (reorder at {item.get('reorder_point', 0)})")
        
        if real_time_data.get('costs'):
            costs = real_time_data['costs']
            context_parts.append(f"\nCURRENT COST DATA:")
            context_parts.append(f"- {costs.get('summary', 'No data')}")
            if costs.get('cost_by_priority'):
                context_parts.append(f"  Breakdown by Priority:")
                for priority, amount in costs['cost_by_priority'].items():
                    context_parts.append(f"    • {priority}: ${amount:,.2f}")
        
        if real_time_data.get('equipment'):
            eq = real_time_data['equipment']
            context_parts.append(f"\nCURRENT EQUIPMENT STATUS:")
            context_parts.append(f"- {eq.get('summary', 'No data')}")
            if eq.get('critical_equipment'):
                context_parts.append(f"  Critical Equipment:")
                for equipment in eq['critical_equipment']:
                    context_parts.append(f"    • {equipment.get('name', 'Unknown')} ({equipment.get('equipment_code', 'N/A')})")
        
        if real_time_data.get('work_orders'):
            wo = real_time_data['work_orders']
            context_parts.append(f"\nCURRENT WORK ORDERS:")
            context_parts.append(f"- {wo.get('summary', 'No data')}")
        
        if real_time_data.get('predictions'):
            pred = real_time_data['predictions']
            context_parts.append(f"\nRECENT PREDICTIONS:")
            context_parts.append(f"- {pred.get('summary', 'No data')}")
        
        # Add historical reports
        reports = historical_context.get('relevant_reports', [])
        if reports:
            context_parts.append("\nRELEVANT HISTORICAL REPORTS:")
            for i, report in enumerate(reports[:3], 1):
                context_parts.append(
                    f"{i}. [{report['title']}] - {report['summary'][:100]}"
                )
        
        return "\n".join(context_parts) if context_parts else "No data available."
    
    def _extract_citations(self, response_text: str, reports: List[Dict]) -> List[Dict]:
        """Extract report citations from response text"""
        citations = []
        
        for report in reports:
            # Check if report title is mentioned in response
            if report['title'].lower() in response_text.lower():
                citations.append({
                    'report_id': report['id'],
                    'title': report['title'],
                    'type': 'report'
                })
        
        return citations
    
    def _generate_fallback_response(self, message: str, historical_context: Dict) -> str:
        """Generate fallback response when LLM fails"""
        reports = historical_context.get('relevant_reports', [])
        
        if reports:
            response = f"I found {len(reports)} relevant historical reports:\n\n"
            for i, report in enumerate(reports[:3], 1):
                response += f"{i}. {report['title']}\n   {report['summary'][:100]}...\n\n"
            return response
        else:
            return "I don't have any historical data matching your query."
    
    async def _store_conversation(
        self,
        session_id: str,
        message: str,
        response: Dict,
        historical_context: Dict
    ):
        """Store conversation in database for learning"""
        try:
            # Generate embeddings
            message_embedding = await self.embedding_service.embed_text(message)
            response_embedding = await self.embedding_service.embed_text(response['content'])
            
            # Extract cited report IDs
            cited_reports = [c['report_id'] for c in response.get('citations', [])]
            
            async with self.pg_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO chatbot_conversations (
                        session_id, user_message, ai_response,
                        historical_context, cited_reports,
                        message_embedding, response_embedding
                    ) VALUES ($1, $2, $3, $4, $5, $6::vector, $7::vector)
                """,
                    session_id, message, response['content'],
                    json.dumps(historical_context), cited_reports,
                    str(message_embedding), str(response_embedding)
                )
                
        except Exception as e:
            logger.warning(f"Failed to store conversation: {e}")
