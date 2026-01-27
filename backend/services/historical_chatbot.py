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
        
        # Search reports semantically
        reports = await self.report_storage.retrieve_similar_reports(
            query=query,
            context=user_context,
            limit=5
        )
        
        # Get conversation history for this session
        # (simplified - would need session management)
        
        return {
            'relevant_reports': reports,
            'patterns': [],
            'trends': []
        }
    
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
        
        reports = historical_context.get('relevant_reports', [])
        if reports:
            context_parts.append("Relevant Historical Reports:")
            for i, report in enumerate(reports[:3], 1):
                context_parts.append(
                    f"{i}. [{report['title']}] - {report['summary'][:100]}"
                )
        
        return "\n".join(context_parts) if context_parts else "No historical data available."
    
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
