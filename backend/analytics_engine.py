"""Analytics Engine for Predictive Maintenance"""
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

class PredictionData(BaseModel):
    prediction_id: str
    equipment_id: str
    equipment_name: str
    predicted_failure: str
    confidence_score: float
    predicted_date: Optional[str] = None
    severity: str
    sensor_data: Dict[str, Any]
    health_score: float
    time_to_failure_hours: float


class AnalyticsPackage(BaseModel):
    prediction_id: str
    impact_analysis: Dict[str, Any]
    historical_context: Dict[str, Any]
    recommendations: List[str]
    resource_requirements: Dict[str, Any]
    timeline_schedule: Dict[str, Any]
    confidence_metrics: Dict[str, Any]
    generated_at: str


class AnalyticsEngine:
    """Core analytics engine for processing predictions"""
    
    def __init__(self, prediction_data: Dict[str, Any]):
        self.prediction = prediction_data
        self.insights = []
        self.analytics_package = {}
    
    def calculate_impact(self) -> Dict[str, Any]:
        """Calculate financial and operational impact"""
        
        # Base costs and multipliers based on severity
        base_cost = self.prediction.get('estimated_cost', 5000)
        severity = self.prediction.get('maintenance_urgency', 'medium')
        
        multipliers = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.5,
            'critical': 2.5
        }
        
        multiplier = multipliers.get(severity, 1.0)
        
        # Calculate impacts
        estimated_cost = base_cost * multiplier
        downtime_hours = self.prediction.get('time_to_failure_hours', 24) * 0.2  # 20% of time to failure
        production_loss = downtime_hours * 15  # 15 units per hour estimate
        
        return {
            'cost': round(estimated_cost, 2),
            'downtime_hours': round(downtime_hours, 1),
            'production_loss': int(production_loss),
            'revenue_impact': round(production_loss * 35, 2),  # $35 per unit
            'total_financial_impact': round(estimated_cost + (production_loss * 35), 2)
        }
    
    def get_similar_failures(self) -> Dict[str, Any]:
        """Get historical context from similar failures"""
        
        equipment_type = self.prediction.get('equipment', {}).get('equipment_type', 'Unknown')
        failure_type = self.prediction.get('failure_types', [{}])[0].get('type', 'Unknown') if self.prediction.get('failure_types') else 'Unknown'
        
        # Simulated historical data - in production, this would query a database
        return {
            'similar_events': 12,
            'avg_resolution_time': '4.5 hours',
            'success_rate': '94%',
            'common_cause': failure_type,
            'last_service': self.prediction.get('equipment', {}).get('last_service_date', 'N/A'),
            'sensor_trends': 'Increasing vibration over 72 hours',
            'equipment_type': equipment_type
        }
    
    def generate_recommendations(self) -> List[str]:
        """Generate actionable recommendations"""
        
        severity = self.prediction.get('maintenance_urgency', 'medium')
        time_to_failure = self.prediction.get('time_to_failure_hours', 168)
        
        recommendations = []
        
        if severity in ['critical', 'high']:
            recommendations.append('URGENT: Schedule immediate maintenance within 24-48 hours')
            recommendations.append('Order critical spare parts expedited delivery')
            recommendations.append('Notify operations team to prepare for downtime')
        elif severity == 'medium':
            recommendations.append(f'Schedule maintenance before {time_to_failure} hours')
            recommendations.append('Order standard replacement parts')
        else:
            recommendations.append('Monitor equipment closely and schedule routine maintenance')
        
        # Add specific recommendations based on failure types
        failure_types = self.prediction.get('failure_types', [])
        if failure_types:
            for failure in failure_types:
                failure_type = failure.get('type', '')
                if 'bearing' in failure_type.lower():
                    recommendations.append('Inspect bearing housing and lubrication system')
                    recommendations.append('Prepare bearing replacement kit')
                elif 'motor' in failure_type.lower():
                    recommendations.append('Check motor windings and electrical connections')
                    recommendations.append('Verify cooling system functionality')
                elif 'pump' in failure_type.lower():
                    recommendations.append('Inspect impeller and seals')
                    recommendations.append('Check fluid levels and pressure')
        
        return recommendations
    
    def calculate_resources(self) -> Dict[str, Any]:
        """Calculate required resources"""
        
        severity = self.prediction.get('maintenance_urgency', 'medium')
        
        # Resource estimates based on severity
        resource_map = {
            'low': {'technicians': 1, 'hours': 2, 'parts_cost': 500},
            'medium': {'technicians': 1, 'hours': 4, 'parts_cost': 1500},
            'high': {'technicians': 2, 'hours': 6, 'parts_cost': 3000},
            'critical': {'technicians': 3, 'hours': 8, 'parts_cost': 5000}
        }
        
        resources = resource_map.get(severity, resource_map['medium'])
        
        # Add skill requirements
        failure_types = self.prediction.get('failure_types', [])
        skills = ['mechanical_maintenance']
        
        if failure_types:
            for failure in failure_types:
                failure_type = failure.get('type', '').lower()
                if 'electrical' in failure_type or 'motor' in failure_type:
                    skills.append('electrical_systems')
                if 'hydraulic' in failure_type or 'pump' in failure_type:
                    skills.append('hydraulics')
        
        return {
            'technicians_required': resources['technicians'],
            'estimated_hours': resources['hours'],
            'estimated_parts_cost': resources['parts_cost'],
            'required_skills': list(set(skills)),
            'tools_needed': ['Standard toolkit', 'Diagnostic equipment']
        }
    
    def create_maintenance_schedule(self) -> Dict[str, Any]:
        """Create recommended maintenance timeline"""
        
        time_to_failure = self.prediction.get('time_to_failure_hours', 168)
        severity = self.prediction.get('maintenance_urgency', 'medium')
        
        # Calculate recommended start time (leaving safety buffer)
        safety_buffer = {
            'low': 0.5,
            'medium': 0.6,
            'high': 0.7,
            'critical': 0.8
        }
        
        buffer = safety_buffer.get(severity, 0.6)
        recommended_start = datetime.now() + timedelta(hours=time_to_failure * (1 - buffer))
        
        return {
            'recommended_start': recommended_start.isoformat(),
            'latest_start': (datetime.now() + timedelta(hours=time_to_failure * 0.9)).isoformat(),
            'estimated_duration_hours': self.calculate_resources()['estimated_hours'],
            'buffer_hours': time_to_failure * buffer,
            'urgency_level': severity
        }
    
    def generate_analytics_package(self) -> AnalyticsPackage:
        """Generate complete analytics package"""
        
        package = AnalyticsPackage(
            prediction_id=self.prediction.get('id', ''),
            impact_analysis=self.calculate_impact(),
            historical_context=self.get_similar_failures(),
            recommendations=self.generate_recommendations(),
            resource_requirements=self.calculate_resources(),
            timeline_schedule=self.create_maintenance_schedule(),
            confidence_metrics={
                'data_quality': 92,
                'model_score': int(self.prediction.get('confidence_score', 85)),
                'historical_accuracy': 89
            },
            generated_at=datetime.now().isoformat()
        )
        
        self.analytics_package = package.dict()
        return package


class AnalyticsChatbot:
    """Chatbot for explaining analytics and predictions"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def explain_prediction(self, prediction_data: Dict[str, Any], analytics: Dict[str, Any]) -> str:
        """Generate explanation using Claude Sonnet 4.5"""
        
        try:
            # Create chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"analytics_{prediction_data.get('id', 'unknown')}",
                system_message="You are Vida AI, an intelligent analytics assistant for predictive maintenance. Provide clear, actionable explanations of predictions and analytics data."
            )
            
            # Use Claude Sonnet 4.5 for structured reasoning
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            # Build comprehensive context
            context = f"""
Analyze this equipment prediction and provide a comprehensive explanation:

**Equipment**: {prediction_data.get('equipment', {}).get('name', 'Unknown')}
**Equipment Type**: {prediction_data.get('equipment', {}).get('equipment_type', 'Unknown')}
**Health Score**: {prediction_data.get('health_score', 0)}/100
**Confidence**: {prediction_data.get('confidence_score', 0)}%
**Time to Failure**: {prediction_data.get('time_to_failure_hours', 0)} hours
**Urgency**: {prediction_data.get('maintenance_urgency', 'Unknown')}

**Sensor Data**:
{json.dumps(prediction_data.get('sensor_data', {}), indent=2)}

**Analytics**:
- Financial Impact: ${analytics.get('impact_analysis', {}).get('total_financial_impact', 0):,.2f}
- Downtime: {analytics.get('impact_analysis', {}).get('downtime_hours', 0)} hours
- Production Loss: {analytics.get('impact_analysis', {}).get('production_loss', 0)} units
- Similar Events: {analytics.get('historical_context', {}).get('similar_events', 0)}
- Success Rate: {analytics.get('historical_context', {}).get('success_rate', 'N/A')}

**Recommendations**:
{chr(10).join(['- ' + rec for rec in analytics.get('recommendations', [])])}

Provide a structured explanation covering:
1. Why this prediction was made (key indicators)
2. Impact analysis (financial and operational)
3. Confidence factors
4. Recommended actions with timeline

Be concise but thorough. Use bullet points for clarity.
"""
            
            # Send message
            user_message = UserMessage(text=context)
            response = await chat.send_message(user_message)
            
            return response
            
        except Exception as e:
            return f"Error generating explanation: {str(e)}. The analytics data shows: {analytics.get('recommendations', [])[0] if analytics.get('recommendations') else 'Maintenance required.'}"
    
    async def answer_analytics_query(self, query: str, analytics_data: Dict[str, Any]) -> str:
        """Answer specific questions about analytics"""
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"query_{datetime.now().timestamp()}",
                system_message="You are Vida AI, helping users understand predictive analytics data. Be precise and actionable."
            )
            
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            context = f"""
User Query: {query}

Analytics Context:
{json.dumps(analytics_data, indent=2)}

Provide a clear, specific answer to the user's question based on this analytics data.
"""
            
            user_message = UserMessage(text=context)
            response = await chat.send_message(user_message)
            
            return response
            
        except Exception as e:
            return f"I apologize, but I encountered an error processing your query: {str(e)}"
