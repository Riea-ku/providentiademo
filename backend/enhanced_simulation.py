"""
Enhanced Simulation Engine with Historical Integration
Automatically stores events and generates historical context
"""
from simulation_engine import SimulationEngine as BaseSimulationEngine
from typing import Dict
from datetime import datetime


class EnhancedSimulationEngine(BaseSimulationEngine):
    """
    Enhanced simulation engine that integrates with historical system
    """
    
    def __init__(self, db_client, ws_manager, event_orchestrator=None, report_storage=None):
        super().__init__(db_client, ws_manager)
        self.event_orchestrator = event_orchestrator
        self.report_storage = report_storage
    
    async def run_simulation(self, request):
        """Override to add historical event logging"""
        
        # Log simulation start event
        if self.event_orchestrator:
            await self.event_orchestrator.handle_system_event(
                'simulation_started',
                {
                    'failure_mode': request.failure_mode,
                    'equipment_id': request.equipment_id,
                    'timestamp': datetime.now().isoformat()
                }
            )
        
        # Run original simulation
        simulation = await super().run_simulation(request)
        
        # Log simulation completion with historical context
        if self.event_orchestrator:
            await self.event_orchestrator.handle_system_event(
                'simulation_completed',
                {
                    'simulation_id': simulation.id,
                    'failure_mode': request.failure_mode,
                    'equipment_id': request.equipment_id,
                    'status': simulation.status,
                    'prediction_data': simulation.prediction_data,
                    'analytics_data': simulation.analytics_data,
                    'timestamp': datetime.now().isoformat()
                }
            )
        
        # Store report with historical metadata
        if self.report_storage and simulation.report_data:
            await self.report_storage.store_report_with_ai_metadata(simulation.report_data)
        
        return simulation
    
    async def step_1_generate_prediction(self, simulation, failure_mode: str):
        """Enhanced prediction generation with historical context"""
        
        # Get historical context for this equipment
        historical_context = None
        if self.event_orchestrator:
            historical_context = await self.event_orchestrator.get_historical_context(
                'prediction_created',
                {'equipment_id': simulation.equipment_id}
            )
        
        # Run original prediction
        await super().step_1_generate_prediction(simulation, failure_mode)
        
        # Enhance prediction with historical insights
        if historical_context and simulation.prediction_data:
            simulation.prediction_data['historical_context'] = {
                'similar_failures': len(historical_context.get('similar_events', [])),
                'avg_cost_historical': self._calculate_avg_cost(historical_context),
                'recommendations': historical_context.get('recommendations_based_on_history', [])
            }
    
    def _calculate_avg_cost(self, historical_context: Dict) -> float:
        """Calculate average cost from historical events"""
        events = historical_context.get('similar_events', [])
        if not events:
            return 0.0
        
        costs = [
            e.get('data', {}).get('estimated_cost', 0) 
            for e in events
        ]
        
        return sum(costs) / len(costs) if costs else 0.0


class PredictiveMaintenanceScheduler:
    """
    Generates predictive maintenance schedules based on historical patterns
    """
    
    def __init__(self, db_client, pattern_recognizer):
        self.db = db_client
        self.pattern_recognizer = pattern_recognizer
    
    async def predict_next_failure(self, equipment_id: str) -> Dict:
        """Predict when next failure is likely to occur"""
        
        # Get equipment patterns
        patterns = await self.pattern_recognizer.get_patterns_for_equipment(equipment_id)
        
        if not patterns or patterns.get('total_failures', 0) == 0:
            return {
                'equipment_id': equipment_id,
                'prediction': 'insufficient_data',
                'confidence': 0.0
            }
        
        # Calculate prediction based on patterns
        optimal_interval = patterns.get('optimal_maintenance_interval_days', 90)
        last_failure = patterns.get('last_failure_date')
        
        if not last_failure:
            return {
                'equipment_id': equipment_id,
                'prediction': 'no_recent_data',
                'confidence': 0.0
            }
        
        # Calculate days since last failure
        from datetime import datetime, timedelta
        last_failure_date = datetime.fromisoformat(last_failure)
        days_since = (datetime.now() - last_failure_date).days
        
        # Predict next failure
        days_until_next = max(0, optimal_interval - days_since)
        predicted_date = datetime.now() + timedelta(days=days_until_next)
        
        # Calculate confidence based on pattern consistency
        failure_count = patterns.get('total_failures', 0)
        confidence = min(0.95, 0.5 + (failure_count * 0.05))  # More data = higher confidence
        
        return {
            'equipment_id': equipment_id,
            'predicted_failure_date': predicted_date.isoformat(),
            'days_until_failure': days_until_next,
            'confidence': confidence,
            'recommended_action': self._get_recommendation(days_until_next),
            'based_on_failures': failure_count,
            'optimal_interval_days': optimal_interval
        }
    
    def _get_recommendation(self, days_until: int) -> str:
        """Get maintenance recommendation based on days until failure"""
        
        if days_until <= 7:
            return "URGENT: Schedule immediate maintenance"
        elif days_until <= 30:
            return "HIGH PRIORITY: Schedule maintenance within 2 weeks"
        elif days_until <= 60:
            return "MEDIUM PRIORITY: Plan maintenance for next month"
        else:
            return "LOW PRIORITY: Continue monitoring, maintenance not urgent"
    
    async def generate_maintenance_schedule(self, equipment_ids: list = None) -> Dict:
        """Generate comprehensive maintenance schedule"""
        
        # Get all equipment if not specified
        if not equipment_ids:
            simulations = await self.db.ai_simulations.find().to_list(1000)
            equipment_ids = list(set([s.get('equipment_id') for s in simulations if s.get('equipment_id')]))
        
        schedule = {
            'generated_at': datetime.now().isoformat(),
            'equipment_count': len(equipment_ids),
            'urgent': [],
            'high_priority': [],
            'medium_priority': [],
            'low_priority': []
        }
        
        # Generate predictions for each equipment
        for eq_id in equipment_ids:
            prediction = await self.predict_next_failure(eq_id)
            
            if prediction['prediction'] in ['insufficient_data', 'no_recent_data']:
                continue
            
            # Categorize by urgency
            days_until = prediction['days_until_failure']
            
            if days_until <= 7:
                schedule['urgent'].append(prediction)
            elif days_until <= 30:
                schedule['high_priority'].append(prediction)
            elif days_until <= 60:
                schedule['medium_priority'].append(prediction)
            else:
                schedule['low_priority'].append(prediction)
        
        # Sort each category by days until failure
        for category in ['urgent', 'high_priority', 'medium_priority', 'low_priority']:
            schedule[category].sort(key=lambda x: x['days_until_failure'])
        
        return schedule
    
    async def forecast_costs(self, days_ahead: int = 90) -> Dict:
        """Forecast maintenance costs for next N days"""
        
        # Get all equipment
        simulations = await self.db.ai_simulations.find().to_list(1000)
        equipment_ids = list(set([s.get('equipment_id') for s in simulations if s.get('equipment_id')]))
        
        forecast = {
            'forecast_period_days': days_ahead,
            'generated_at': datetime.now().isoformat(),
            'total_predicted_cost': 0.0,
            'equipment_forecasts': []
        }
        
        # Forecast for each equipment
        for eq_id in equipment_ids:
            prediction = await self.predict_next_failure(eq_id)
            patterns = await self.pattern_recognizer.get_patterns_for_equipment(eq_id)
            
            if prediction['prediction'] in ['insufficient_data', 'no_recent_data']:
                continue
            
            # Check if failure predicted within forecast period
            days_until = prediction['days_until_failure']
            
            if days_until <= days_ahead:
                avg_cost = patterns.get('avg_cost_per_failure', 0)
                
                equipment_forecast = {
                    'equipment_id': eq_id,
                    'predicted_failure_date': prediction['predicted_failure_date'],
                    'predicted_cost': avg_cost,
                    'confidence': prediction['confidence']
                }
                
                forecast['equipment_forecasts'].append(equipment_forecast)
                forecast['total_predicted_cost'] += avg_cost
        
        # Sort by date
        forecast['equipment_forecasts'].sort(key=lambda x: x['predicted_failure_date'])
        
        return forecast
    
    async def identify_risk_periods(self, days_ahead: int = 180) -> Dict:
        """Identify periods with high failure risk"""
        
        from collections import defaultdict
        
        # Get maintenance schedule
        schedule = await self.generate_maintenance_schedule()
        
        # Group by month
        monthly_risk = defaultdict(lambda: {
            'equipment_count': 0,
            'total_cost': 0.0,
            'equipment_list': [],
            'risk_level': 'low'
        })
        
        # Categorize all predictions by month
        all_predictions = (
            schedule['urgent'] + 
            schedule['high_priority'] + 
            schedule['medium_priority'] + 
            schedule['low_priority']
        )
        
        for pred in all_predictions:
            if pred['days_until_failure'] > days_ahead:
                continue
            
            # Get month from predicted date
            pred_date = datetime.fromisoformat(pred['predicted_failure_date'])
            month_key = pred_date.strftime('%Y-%m')
            
            # Get equipment patterns for cost
            patterns = await self.pattern_recognizer.get_patterns_for_equipment(pred['equipment_id'])
            cost = patterns.get('avg_cost_per_failure', 0)
            
            monthly_risk[month_key]['equipment_count'] += 1
            monthly_risk[month_key]['total_cost'] += cost
            monthly_risk[month_key]['equipment_list'].append({
                'equipment_id': pred['equipment_id'],
                'date': pred['predicted_failure_date'],
                'cost': cost
            })
        
        # Calculate risk levels
        max_count = max([data['equipment_count'] for data in monthly_risk.values()]) if monthly_risk else 1
        
        for month, data in monthly_risk.items():
            if data['equipment_count'] >= max_count * 0.7:
                data['risk_level'] = 'critical'
            elif data['equipment_count'] >= max_count * 0.4:
                data['risk_level'] = 'high'
            elif data['equipment_count'] >= max_count * 0.2:
                data['risk_level'] = 'medium'
            else:
                data['risk_level'] = 'low'
        
        return {
            'forecast_period_days': days_ahead,
            'generated_at': datetime.now().isoformat(),
            'monthly_risk': dict(sorted(monthly_risk.items())),
            'highest_risk_month': max(monthly_risk.items(), key=lambda x: x[1]['equipment_count'])[0] if monthly_risk else None
        }
