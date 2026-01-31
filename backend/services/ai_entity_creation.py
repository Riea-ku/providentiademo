"""
AI Entity Creation Service
Handles intelligent conversational creation of all entities
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from uuid import uuid4
from ai_creation_templates import AI_CREATION_TEMPLATES, VALIDATION_RULES, CONTEXT_SUGGESTIONS

logger = logging.getLogger(__name__)


class AIEntityCreationService:
    """Manages AI-driven entity creation through conversation"""
    
    def __init__(self, mongo_db):
        self.mongo_db = mongo_db
        self.active_conversations = {}  # session_id -> conversation_state
    
    def start_creation_conversation(self, session_id: str, entity_type: str, subtype: Optional[str] = None) -> Dict:
        """
        Start a new entity creation conversation
        
        Args:
            session_id: Unique conversation ID
            entity_type: Type of entity (farms, equipment, work_orders, inventory)
            subtype: Specific subtype (crop, tractor, etc.)
        """
        try:
            # Get template
            if subtype and entity_type in AI_CREATION_TEMPLATES:
                template = AI_CREATION_TEMPLATES[entity_type].get(subtype)
            else:
                # If no subtype, ask user to choose
                template = None
            
            # Initialize conversation state
            self.active_conversations[session_id] = {
                'entity_type': entity_type,
                'subtype': subtype,
                'template': template,
                'current_question_index': 0,
                'collected_data': {},
                'started_at': datetime.now(timezone.utc).isoformat()
            }
            
            # If no template yet, ask for subtype
            if not template:
                return self._ask_for_subtype(session_id, entity_type)
            
            # Start with first question
            return self._get_next_question(session_id)
            
        except Exception as e:
            logger.error(f"Failed to start creation conversation: {e}")
            return {'error': str(e)}
    
    def _ask_for_subtype(self, session_id: str, entity_type: str) -> Dict:
        """Ask user to choose entity subtype"""
        subtypes = list(AI_CREATION_TEMPLATES.get(entity_type, {}).keys())
        
        return {
            'question': f'What type of {entity_type[:-1]} would you like to add?',
            'type': 'choice',
            'options': subtypes,
            'field': 'subtype',
            'progress': 0
        }
    
    def process_answer(self, session_id: str, answer: Any) -> Dict:
        """
        Process user's answer and return next question or completion
        
        Args:
            session_id: Conversation ID
            answer: User's answer
            
        Returns:
            Next question or completion status
        """
        try:
            if session_id not in self.active_conversations:
                return {'error': 'Conversation not found'}
            
            conv = self.active_conversations[session_id]
            
            # If answering subtype question
            if not conv['template']:
                conv['subtype'] = answer
                conv['template'] = AI_CREATION_TEMPLATES[conv['entity_type']].get(answer)
                conv['current_question_index'] = 0
                return self._get_next_question(session_id)
            
            # Validate and store answer
            template = conv['template']
            questions = template.get('questions', [])
            current_q = questions[conv['current_question_index']]
            
            # Validate answer
            is_valid, error_msg = self._validate_answer(answer, current_q)
            if not is_valid:
                return {
                    'question': current_q['question'],
                    'error': error_msg,
                    'type': current_q['type'],
                    'field': current_q['field']
                }
            
            # Store answer
            conv['collected_data'][current_q['field']] = answer
            conv['current_question_index'] += 1
            
            # Check if more questions
            if conv['current_question_index'] < len(questions):
                return self._get_next_question(session_id)
            
            # All questions answered - complete creation synchronously
            return self._complete_creation_sync(session_id)
            
        except Exception as e:
            logger.error(f"Failed to process answer: {e}")
            return {'error': str(e)}
    
    def _get_next_question(self, session_id: str) -> Dict:
        """Get the next question in the flow"""
        conv = self.active_conversations[session_id]
        template = conv['template']
        questions = template.get('questions', [])
        index = conv['current_question_index']
        
        if index >= len(questions):
            return self._complete_creation(session_id)
        
        question = questions[index]
        total_questions = len(questions)
        
        response = {
            'question': question['question'],
            'type': question['type'],
            'field': question['field'],
            'progress': int((index / total_questions) * 100)
        }
        
        # Add options for choice questions
        if question['type'] == 'choice' and 'options' in question:
            response['options'] = question['options']
        
        # Add reference data for reference questions
        if question['type'] == 'reference':
            response['reference_data'] = self._get_reference_options(question.get('reference_type'))
        
        # Add AI suggestion if available
        if 'suggestions' in template and question['field'] in template['suggestions']:
            response['suggestion'] = template['suggestions'][question['field']]
        
        return response
    
    def _validate_answer(self, answer: Any, question: Dict) -> tuple:
        """Validate user's answer"""
        q_type = question['type']
        
        if q_type == 'text':
            if not isinstance(answer, str) or len(answer) < 1:
                return False, "Please provide a valid text answer"
            return True, None
        
        elif q_type == 'number':
            try:
                float(answer)
                return True, None
            except:
                return False, "Please provide a valid number"
        
        elif q_type == 'choice':
            if answer not in question.get('options', []):
                return False, f"Please choose from: {', '.join(question['options'])}"
            return True, None
        
        elif q_type == 'list':
            if not isinstance(answer, str):
                return False, "Please provide comma-separated values"
            return True, None
        
        elif q_type == 'date':
            # Simple date validation
            return True, None
        
        elif q_type == 'reference':
            return True, None
        
        return True, None
    
    def _get_reference_options(self, reference_type: str) -> List[Dict]:
        """Get available options for reference fields"""
        # This would query the database for available entities
        # Simplified for now
        return []
    
    def _complete_creation_sync(self, session_id: str) -> Dict:
        """Complete entity creation synchronously (DB write is queued)"""
        try:
            conv = self.active_conversations[session_id]
            entity_type = conv['entity_type']
            collected_data = conv['collected_data']
            
            # Add metadata
            entity_data = {
                'id': str(uuid4()),
                **collected_data,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'created_by': 'ai_assistant',
                'status': 'active'
            }
            
            # Queue the database write asynchronously
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self._save_entity(entity_type, entity_data))
                else:
                    loop.run_until_complete(self._save_entity(entity_type, entity_data))
            except RuntimeError:
                # If no event loop, create one
                asyncio.run(self._save_entity(entity_type, entity_data))
            
            # Clean up conversation
            del self.active_conversations[session_id]
            
            return {
                'completed': True,
                'entity_type': entity_type,
                'entity_id': entity_data['id'],
                'message': f"{entity_type[:-1].title()} created successfully!",
                'data': entity_data
            }
            
        except Exception as e:
            logger.error(f"Failed to complete creation: {e}")
            return {'error': str(e)}
    
    async def _save_entity(self, entity_type: str, entity_data: Dict):
        """Save entity to database"""
        try:
            collection_name = entity_type
            await self.mongo_db[collection_name].insert_one(entity_data.copy())
            logger.info(f"Created {entity_type}: {entity_data['id']}")
        except Exception as e:
            logger.error(f"Failed to save entity to DB: {e}")
    
    async def _complete_creation(self, session_id: str) -> Dict:
        """Complete entity creation and save to database"""
        try:
            conv = self.active_conversations[session_id]
            entity_type = conv['entity_type']
            collected_data = conv['collected_data']
            
            # Add metadata
            entity_data = {
                'id': str(uuid4()),
                **collected_data,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'created_by': 'ai_assistant',
                'status': 'active'
            }
            
            # Save to appropriate collection
            collection_name = entity_type
            await self.mongo_db[collection_name].insert_one(entity_data)
            
            # Clean up conversation
            del self.active_conversations[session_id]
            
            return {
                'completed': True,
                'entity_type': entity_type,
                'entity_id': entity_data['id'],
                'message': f"{entity_type[:-1].title()} created successfully!",
                'data': entity_data
            }
            
        except Exception as e:
            logger.error(f"Failed to complete creation: {e}")
            return {'error': str(e)}
    
    def cancel_conversation(self, session_id: str):
        """Cancel an ongoing conversation"""
        if session_id in self.active_conversations:
            del self.active_conversations[session_id]
        return {'cancelled': True}


# Global instance
ai_creation_service = None
