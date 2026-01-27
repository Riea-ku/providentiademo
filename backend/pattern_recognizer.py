"""
Historical Pattern Recognition System
Identifies patterns across all historical data
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict, Counter


class HistoricalPatternRecognizer:
    """
    Identifies patterns across historical data
    Enables predictive insights based on history
    """
    
    def __init__(self, db_client):
        self.db = db_client
    
    async def analyze_system_patterns(self, time_period: str = '365d') -> Dict:
        """
        Analyze patterns across all historical data
        
        Args:
            time_period: Time period to analyze (e.g., '30d', '90d', '365d', 'all')
        
        Returns:
            Comprehensive pattern analysis
        """
        
        # Parse time period
        days = self.parse_time_period(time_period)
        
        # 1. Equipment failure patterns
        failure_patterns = await self.analyze_failure_patterns(days)
        
        # 2. Maintenance effectiveness patterns
        maintenance_patterns = await self.analyze_maintenance_patterns(days)
        
        # 3. Cost optimization patterns
        cost_patterns = await self.analyze_cost_patterns(days)
        
        # 4. Technician performance patterns
        technician_patterns = await self.analyze_technician_patterns(days)
        
        # 5. Seasonal/cyclic patterns
        seasonal_patterns = await self.analyze_seasonal_patterns(days)
        
        # 6. Anomaly detection
        anomalies = await self.detect_historical_anomalies(days)
        
        # 7. Success/failure correlation patterns
        correlation_patterns = await self.analyze_correlations(days)
        
        # 8. Generate predictive insights
        predictive_insights = await self.generate_predictive_insights(
            failure_patterns,
            maintenance_patterns,
            seasonal_patterns
        )
        
        return {
            'time_period': time_period,
            'days_analyzed': days,
            'failure_patterns': failure_patterns,
            'maintenance_patterns': maintenance_patterns,
            'cost_patterns': cost_patterns,
            'technician_patterns': technician_patterns,
            'seasonal_patterns': seasonal_patterns,
            'anomalies': anomalies,
            'correlations': correlation_patterns,
            'predictive_insights': predictive_insights,
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def parse_time_period(self, time_period: str) -> int:
        """Parse time period string to days"""
        
        if time_period == 'all':
            return 99999  # Very large number
        
        if time_period.endswith('d'):
            return int(time_period[:-1])
        elif time_period.endswith('m'):
            return int(time_period[:-1]) * 30
        elif time_period.endswith('y'):
            return int(time_period[:-1]) * 365
        
        return 365  # Default to 1 year
    
    async def analyze_failure_patterns(self, days: int) -> Dict:
        """Analyze equipment failure patterns"""
        
        # Get simulations and predictions from time period
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        simulations = await self.db.ai_simulations.find(
            {'started_at': {'$gte': cutoff_date}}
        ).to_list(1000)
        
        predictions = await self.db.predictions_demo.find().to_list(1000)
        
        # Analyze failure types
        failure_types = Counter()
        failure_by_equipment = defaultdict(list)
        failure_timeline = defaultdict(int)
        
        for sim in simulations:
            failure_mode = sim.get('failure_mode', 'unknown')
            equipment_id = sim.get('equipment_id', 'unknown')
            
            failure_types[failure_mode] += 1
            failure_by_equipment[equipment_id].append(failure_mode)
            
            # Timeline analysis
            if sim.get('started_at'):
                date = sim['started_at'][:10]  # YYYY-MM-DD
                failure_timeline[date] += 1
        
        # Calculate failure rates
        total_failures = len(simulations)
        failure_rates = {
            failure: (count / total_failures * 100) if total_failures > 0 else 0
            for failure, count in failure_types.items()
        }
        
        # Identify high-risk equipment
        high_risk_equipment = {
            eq_id: len(failures)
            for eq_id, failures in failure_by_equipment.items()
            if len(failures) >= 3
        }
        
        return {
            'total_failures': total_failures,
            'failure_types': dict(failure_types.most_common()),
            'failure_rates': failure_rates,
            'high_risk_equipment': high_risk_equipment,
            'failure_timeline': dict(sorted(failure_timeline.items())[-30:]),  # Last 30 days
            'most_common_failure': failure_types.most_common(1)[0] if failure_types else ('None', 0)
        }
    
    async def analyze_maintenance_patterns(self, days: int) -> Dict:
        """Analyze maintenance effectiveness patterns"""
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get work orders
        work_orders = await self.db.work_orders.find().to_list(1000)
        
        # Get dispatch history
        dispatches = await self.db.dispatch_history.find().to_list(1000)
        
        # Analyze completion rates
        total_orders = len(work_orders)
        completed = sum(1 for wo in work_orders if wo.get('status') == 'completed')
        in_progress = sum(1 for wo in work_orders if wo.get('status') == 'in_progress')
        pending = sum(1 for wo in work_orders if wo.get('status') == 'pending')
        
        completion_rate = (completed / total_orders * 100) if total_orders > 0 else 0
        
        # Analyze response times
        response_times = []
        for dispatch in dispatches:
            if dispatch.get('created_at') and dispatch.get('completed_at'):
                created = datetime.fromisoformat(dispatch['created_at'].replace('Z', '+00:00'))
                completed_time = datetime.fromisoformat(dispatch['completed_at'].replace('Z', '+00:00'))
                hours = (completed_time - created).total_seconds() / 3600
                response_times.append(hours)
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        return {
            'total_work_orders': total_orders,
            'completed': completed,
            'in_progress': in_progress,
            'pending': pending,
            'completion_rate': completion_rate,
            'avg_response_time_hours': avg_response_time,
            'maintenance_efficiency': completion_rate  # Simplified metric
        }
    
    async def analyze_cost_patterns(self, days: int) -> Dict:
        """Analyze cost optimization patterns"""
        
        # Get simulations with cost data
        simulations = await self.db.ai_simulations.find().to_list(1000)
        
        total_cost = 0
        cost_by_failure_type = defaultdict(float)
        cost_timeline = defaultdict(float)
        
        for sim in simulations:
            prediction_data = sim.get('prediction_data', {})
            cost = prediction_data.get('estimated_cost', 0)
            
            total_cost += cost
            
            failure_mode = sim.get('failure_mode', 'unknown')
            cost_by_failure_type[failure_mode] += cost
            
            # Timeline
            if sim.get('started_at'):
                month = sim['started_at'][:7]  # YYYY-MM
                cost_timeline[month] += cost
        
        # Calculate average costs
        num_simulations = len(simulations)
        avg_cost = total_cost / num_simulations if num_simulations > 0 else 0
        
        # Identify most expensive failure types
        most_expensive = sorted(
            cost_by_failure_type.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return {
            'total_cost': total_cost,
            'avg_cost_per_failure': avg_cost,
            'cost_by_failure_type': dict(cost_by_failure_type),
            'most_expensive_failure': most_expensive[0] if most_expensive else ('None', 0),
            'cost_timeline': dict(sorted(cost_timeline.items())[-12:]),  # Last 12 months
            'cost_trend': self.calculate_trend(list(cost_timeline.values()))
        }
    
    def calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction"""
        
        if len(values) < 2:
            return 'insufficient_data'
        
        recent_avg = sum(values[-3:]) / 3 if len(values) >= 3 else values[-1]
        older_avg = sum(values[:3]) / 3 if len(values) >= 3 else values[0]
        
        if recent_avg > older_avg * 1.2:
            return 'increasing'
        elif recent_avg < older_avg * 0.8:
            return 'decreasing'
        else:
            return 'stable'
    
    async def analyze_technician_patterns(self, days: int) -> Dict:
        """Analyze technician performance patterns"""
        
        dispatches = await self.db.dispatch_history.find().to_list(1000)
        
        # Analyze by technician
        tech_performance = defaultdict(lambda: {
            'assignments': 0,
            'completed': 0,
            'avg_time': []
        })
        
        for dispatch in dispatches:
            tech_id = dispatch.get('assigned_technician_id', 'unknown')
            tech_performance[tech_id]['assignments'] += 1
            
            if dispatch.get('status') == 'completed':
                tech_performance[tech_id]['completed'] += 1
            
            # Calculate completion time
            if dispatch.get('created_at') and dispatch.get('completed_at'):
                created = datetime.fromisoformat(dispatch['created_at'].replace('Z', '+00:00'))
                completed = datetime.fromisoformat(dispatch['completed_at'].replace('Z', '+00:00'))
                hours = (completed - created).total_seconds() / 3600
                tech_performance[tech_id]['avg_time'].append(hours)
        
        # Calculate metrics
        tech_metrics = {}
        for tech_id, data in tech_performance.items():
            completion_rate = (data['completed'] / data['assignments'] * 100) if data['assignments'] > 0 else 0
            avg_time = sum(data['avg_time']) / len(data['avg_time']) if data['avg_time'] else 0
            
            tech_metrics[tech_id] = {
                'assignments': data['assignments'],
                'completion_rate': completion_rate,
                'avg_completion_time': avg_time
            }
        
        # Identify top performers
        top_performers = sorted(
            tech_metrics.items(),
            key=lambda x: x[1]['completion_rate'],
            reverse=True
        )[:5]
        
        return {
            'total_technicians': len(tech_metrics),
            'technician_metrics': tech_metrics,
            'top_performers': dict(top_performers),
            'avg_completion_rate': sum(m['completion_rate'] for m in tech_metrics.values()) / len(tech_metrics) if tech_metrics else 0
        }
    
    async def analyze_seasonal_patterns(self, days: int) -> Dict:
        """Analyze seasonal/cyclic patterns"""
        
        simulations = await self.db.ai_simulations.find().to_list(1000)
        
        # Group by month
        monthly_failures = defaultdict(int)
        monthly_costs = defaultdict(float)
        
        for sim in simulations:
            if sim.get('started_at'):
                month = int(sim['started_at'][5:7])  # Extract month number
                monthly_failures[month] += 1
                
                if sim.get('prediction_data', {}).get('estimated_cost'):
                    monthly_costs[month] += sim['prediction_data']['estimated_cost']
        
        # Identify peak months
        if monthly_failures:
            peak_failure_month = max(monthly_failures.items(), key=lambda x: x[1])
            peak_cost_month = max(monthly_costs.items(), key=lambda x: x[1])
        else:
            peak_failure_month = (0, 0)
            peak_cost_month = (0, 0)
        
        return {
            'monthly_failure_distribution': dict(sorted(monthly_failures.items())),
            'monthly_cost_distribution': dict(sorted(monthly_costs.items())),
            'peak_failure_month': peak_failure_month[0],
            'peak_cost_month': peak_cost_month[0],
            'seasonal_pattern_detected': len(monthly_failures) >= 3
        }
    
    async def detect_historical_anomalies(self, days: int) -> Dict:
        """Detect anomalies in historical data"""
        
        simulations = await self.db.ai_simulations.find().to_list(1000)
        
        anomalies = {
            'unusual_patterns': [],
            'unexpected_failures': [],
            'cost_spikes': []
        }
        
        # Calculate normal ranges
        costs = [s.get('prediction_data', {}).get('estimated_cost', 0) for s in simulations]
        if costs:
            avg_cost = sum(costs) / len(costs)
            max_cost = max(costs)
            
            # Detect cost spikes (> 2x average)
            for sim in simulations:
                cost = sim.get('prediction_data', {}).get('estimated_cost', 0)
                if cost > avg_cost * 2:
                    anomalies['cost_spikes'].append({
                        'simulation_id': sim.get('id'),
                        'cost': cost,
                        'avg_cost': avg_cost,
                        'deviation': (cost / avg_cost) if avg_cost > 0 else 0
                    })
        
        # Check for unusual failure clusters
        failure_dates = defaultdict(int)
        for sim in simulations:
            if sim.get('started_at'):
                date = sim['started_at'][:10]
                failure_dates[date] += 1
        
        avg_daily_failures = sum(failure_dates.values()) / len(failure_dates) if failure_dates else 0
        
        for date, count in failure_dates.items():
            if count > avg_daily_failures * 2:
                anomalies['unusual_patterns'].append({
                    'date': date,
                    'failure_count': count,
                    'avg_count': avg_daily_failures,
                    'deviation': count / avg_daily_failures if avg_daily_failures > 0 else 0
                })
        
        return anomalies
    
    async def analyze_correlations(self, days: int) -> Dict:
        """Analyze success/failure correlation patterns"""
        
        simulations = await self.db.ai_simulations.find().to_list(1000)
        work_orders = await self.db.work_orders.find().to_list(1000)
        
        correlations = {
            'failure_to_resolution': {},
            'equipment_to_success_rate': {}
        }
        
        # Correlation: Failure type to resolution success
        failure_outcomes = defaultdict(lambda: {'total': 0, 'successful': 0})
        
        for sim in simulations:
            failure_mode = sim.get('failure_mode', 'unknown')
            failure_outcomes[failure_mode]['total'] += 1
            
            if sim.get('status') == 'complete':
                failure_outcomes[failure_mode]['successful'] += 1
        
        for failure, data in failure_outcomes.items():
            success_rate = (data['successful'] / data['total'] * 100) if data['total'] > 0 else 0
            correlations['failure_to_resolution'][failure] = success_rate
        
        return correlations
    
    async def generate_predictive_insights(
        self,
        failure_patterns: Dict,
        maintenance_patterns: Dict,
        seasonal_patterns: Dict
    ) -> List[str]:
        """Generate predictive insights based on patterns"""
        
        insights = []
        
        # Insight from failure patterns
        if failure_patterns.get('most_common_failure'):
            failure_type, count = failure_patterns['most_common_failure']
            if count > 5:
                insights.append(
                    f"⚠️ {failure_type} is the most common failure ({count} occurrences). "
                    f"Recommend increased monitoring of related equipment."
                )
        
        # Insight from maintenance effectiveness
        if maintenance_patterns.get('completion_rate'):
            rate = maintenance_patterns['completion_rate']
            if rate < 70:
                insights.append(
                    f"📊 Maintenance completion rate is {rate:.1f}%. "
                    f"Consider resource optimization to improve efficiency."
                )
            elif rate > 90:
                insights.append(
                    f"✅ Excellent maintenance completion rate ({rate:.1f}%). "
                    f"Current processes are highly effective."
                )
        
        # Insight from seasonal patterns
        if seasonal_patterns.get('peak_failure_month'):
            month = seasonal_patterns['peak_failure_month']
            if month > 0:
                month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                insights.append(
                    f"📅 Peak failure month is {month_names[month]}. "
                    f"Recommend preventive maintenance before this period."
                )
        
        return insights[:5]  # Top 5 insights
    
    async def get_patterns_for_equipment(self, equipment_id: str) -> Dict:
        """Get historical patterns for specific equipment"""
        
        # Get all events for this equipment
        simulations = await self.db.ai_simulations.find(
            {'equipment_id': equipment_id}
        ).to_list(1000)
        
        if not simulations:
            return {
                'equipment_id': equipment_id,
                'message': 'No historical data found for this equipment'
            }
        
        # Calculate failure frequency
        failure_types = Counter(sim.get('failure_mode') for sim in simulations)
        
        # Calculate costs
        total_cost = sum(
            sim.get('prediction_data', {}).get('estimated_cost', 0) 
            for sim in simulations
        )
        avg_cost = total_cost / len(simulations)
        
        # Timeline
        dates = [sim.get('started_at')[:10] for sim in simulations if sim.get('started_at')]
        
        # Calculate optimal maintenance interval
        if len(dates) >= 2:
            sorted_dates = sorted(dates)
            intervals = []
            for i in range(len(sorted_dates) - 1):
                date1 = datetime.fromisoformat(sorted_dates[i])
                date2 = datetime.fromisoformat(sorted_dates[i + 1])
                days = (date2 - date1).days
                intervals.append(days)
            
            optimal_interval = sum(intervals) / len(intervals) if intervals else 90
        else:
            optimal_interval = 90  # Default
        
        patterns = {
            'equipment_id': equipment_id,
            'total_failures': len(simulations),
            'failure_frequency': dict(failure_types),
            'common_failure_types': failure_types.most_common(3),
            'total_cost': total_cost,
            'avg_cost_per_failure': avg_cost,
            'optimal_maintenance_interval_days': optimal_interval,
            'last_failure_date': dates[-1] if dates else None,
            'cost_trend': self.calculate_trend([
                sim.get('prediction_data', {}).get('estimated_cost', 0) 
                for sim in simulations
            ]),
            'recommended_action': self.recommend_action_for_equipment(
                len(simulations), 
                optimal_interval, 
                dates[-1] if dates else None
            )
        }
        
        # Generate AI summary
        patterns['ai_summary'] = self.generate_equipment_pattern_summary(patterns)
        
        return patterns
    
    def recommend_action_for_equipment(
        self, 
        failure_count: int, 
        optimal_interval: float,
        last_failure: str = None
    ) -> str:
        """Recommend action based on equipment patterns"""
        
        if failure_count >= 5:
            return f"High-risk equipment with {failure_count} failures. Schedule immediate inspection."
        
        if last_failure:
            last_date = datetime.fromisoformat(last_failure)
            days_since = (datetime.now() - last_date).days
            
            if days_since >= optimal_interval * 0.8:
                return f"Approaching maintenance window ({days_since}/{optimal_interval:.0f} days). Schedule preventive maintenance soon."
        
        return "Equipment showing normal patterns. Continue regular monitoring."
    
    def generate_equipment_pattern_summary(self, patterns: Dict) -> str:
        """Generate AI summary of equipment patterns"""
        
        summary_parts = []
        
        summary_parts.append(
            f"Equipment {patterns['equipment_id']} has experienced "
            f"{patterns['total_failures']} failures."
        )
        
        if patterns.get('common_failure_types'):
            most_common = patterns['common_failure_types'][0]
            summary_parts.append(
                f"Most common issue: {most_common[0]} ({most_common[1]} times)."
            )
        
        if patterns.get('avg_cost_per_failure'):
            summary_parts.append(
                f"Average cost per failure: ${patterns['avg_cost_per_failure']:,.0f}."
            )
        
        summary_parts.append(patterns['recommended_action'])
        
        return " ".join(summary_parts)
