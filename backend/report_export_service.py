"""
Report Export and Generation Service
Handles PDF/Excel export and automated report generation
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json


class ReportExporter:
    """
    Export reports to various formats
    Currently supports JSON (foundation for PDF/Excel)
    """
    
    def __init__(self, db_client, pattern_recognizer):
        self.db = db_client
        self.pattern_recognizer = pattern_recognizer
    
    async def export_report(self, report_id: str, format: str = 'json') -> Dict:
        """Export a single report"""
        
        # Get report
        report = await self.db.automated_reports.find_one({'id': report_id})
        
        if not report:
            raise ValueError(f"Report {report_id} not found")
        
        # Remove MongoDB _id
        report.pop('_id', None)
        
        if format == 'json':
            return {
                'format': 'json',
                'data': report,
                'exported_at': datetime.now().isoformat()
            }
        elif format == 'csv':
            return await self._export_to_csv(report)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def _export_to_csv(self, report: Dict) -> Dict:
        """Export report to CSV format"""
        
        # Extract key fields for CSV
        csv_data = []
        
        # Header
        header = [
            'Report ID',
            'Created At',
            'Equipment ID',
            'Status',
            'Summary'
        ]
        
        # Data row
        row = [
            report.get('id', ''),
            report.get('created_at', ''),
            report.get('content', {}).get('equipment_id', ''),
            report.get('status', ''),
            report.get('ai_metadata', {}).get('summary', '')[:100]
        ]
        
        csv_data.append(header)
        csv_data.append(row)
        
        return {
            'format': 'csv',
            'data': csv_data,
            'exported_at': datetime.now().isoformat()
        }
    
    async def generate_comparative_report(self, report_ids: List[str]) -> Dict:
        """Generate a comparative report from multiple reports"""
        
        if len(report_ids) < 2:
            raise ValueError("Need at least 2 reports for comparison")
        
        # Get all reports
        reports = []
        for report_id in report_ids:
            report = await self.db.automated_reports.find_one({'id': report_id})
            if report:
                report.pop('_id', None)
                reports.append(report)
        
        if len(reports) < 2:
            raise ValueError("Not enough valid reports found")
        
        # Compare reports
        comparison = {
            'report_count': len(reports),
            'report_ids': report_ids,
            'generated_at': datetime.now().isoformat(),
            'comparison_type': 'multi_report',
            'key_differences': [],
            'similarities': [],
            'summary': ''
        }
        
        # Analyze failure types
        failure_types = [r.get('content', {}).get('failure_analysis', '') for r in reports]
        if len(set(failure_types)) == 1:
            comparison['similarities'].append(f"All reports show same failure type")
        else:
            comparison['key_differences'].append(f"Different failure types: {', '.join(set(failure_types))}")
        
        # Analyze costs
        costs = []
        for r in reports:
            pred_data = r.get('prediction_data', {})
            if isinstance(pred_data, dict):
                cost = pred_data.get('estimated_cost', 0)
                costs.append(cost)
        
        if costs:
            avg_cost = sum(costs) / len(costs)
            max_cost = max(costs)
            min_cost = min(costs)
            
            comparison['cost_analysis'] = {
                'average': avg_cost,
                'maximum': max_cost,
                'minimum': min_cost,
                'variance': max_cost - min_cost
            }
            
            if max_cost > avg_cost * 2:
                comparison['key_differences'].append(f"Significant cost variation detected (max: ${max_cost}, min: ${min_cost})")
        
        # Generate summary
        comparison['summary'] = f"Compared {len(reports)} reports. " + \
            f"Found {len(comparison['key_differences'])} key differences and " + \
            f"{len(comparison['similarities'])} similarities."
        
        comparison['reports'] = reports
        
        return comparison
    
    async def generate_trend_report(
        self, 
        equipment_id: Optional[str] = None,
        days: int = 90
    ) -> Dict:
        """Generate trend analysis report"""
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get simulations
        query = {'started_at': {'$gte': cutoff_date}}
        if equipment_id:
            query['equipment_id'] = equipment_id
        
        simulations = await self.db.ai_simulations.find(query).sort('started_at', 1).to_list(1000)
        
        if not simulations:
            return {
                'report_type': 'trend_analysis',
                'message': 'No data available for trend analysis',
                'days_analyzed': days,
                'equipment_id': equipment_id
            }
        
        # Analyze trends
        from collections import defaultdict
        
        daily_failures = defaultdict(int)
        daily_costs = defaultdict(float)
        failure_types = defaultdict(int)
        
        for sim in simulations:
            date = sim.get('started_at', '')[:10]
            daily_failures[date] += 1
            
            cost = sim.get('prediction_data', {}).get('estimated_cost', 0)
            daily_costs[date] += cost
            
            failure_mode = sim.get('failure_mode', 'unknown')
            failure_types[failure_mode] += 1
        
        # Calculate trend direction
        dates = sorted(daily_failures.keys())
        if len(dates) >= 7:
            recent_avg = sum(daily_failures[d] for d in dates[-7:]) / 7
            earlier_avg = sum(daily_failures[d] for d in dates[:7]) / 7
            
            if recent_avg > earlier_avg * 1.2:
                trend_direction = 'increasing'
            elif recent_avg < earlier_avg * 0.8:
                trend_direction = 'decreasing'
            else:
                trend_direction = 'stable'
        else:
            trend_direction = 'insufficient_data'
        
        return {
            'report_type': 'trend_analysis',
            'generated_at': datetime.now().isoformat(),
            'days_analyzed': days,
            'equipment_id': equipment_id,
            'total_failures': len(simulations),
            'total_cost': sum(daily_costs.values()),
            'daily_failures': dict(sorted(daily_failures.items())),
            'daily_costs': dict(sorted(daily_costs.items())),
            'failure_types': dict(sorted(failure_types.items(), key=lambda x: x[1], reverse=True)),
            'trend_direction': trend_direction,
            'most_common_failure': max(failure_types.items(), key=lambda x: x[1])[0] if failure_types else 'none',
            'peak_failure_date': max(daily_failures.items(), key=lambda x: x[1])[0] if daily_failures else 'none'
        }
    
    async def generate_executive_summary(self, days: int = 30) -> Dict:
        """Generate executive summary report"""
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get data
        simulations = await self.db.ai_simulations.find(
            {'started_at': {'$gte': cutoff_date}}
        ).to_list(1000)
        
        work_orders = await self.db.work_orders.find().to_list(1000)
        
        # Calculate metrics
        total_failures = len(simulations)
        total_cost = sum(
            s.get('prediction_data', {}).get('estimated_cost', 0) 
            for s in simulations
        )
        
        completed_orders = sum(1 for wo in work_orders if wo.get('status') == 'completed')
        completion_rate = (completed_orders / len(work_orders) * 100) if work_orders else 0
        
        # Get patterns
        patterns = await self.pattern_recognizer.analyze_system_patterns(f"{days}d")
        
        # Build summary
        summary = {
            'report_type': 'executive_summary',
            'generated_at': datetime.now().isoformat(),
            'period_days': days,
            'key_metrics': {
                'total_failures': total_failures,
                'total_cost': total_cost,
                'avg_cost_per_failure': total_cost / total_failures if total_failures else 0,
                'work_orders_completed': completed_orders,
                'completion_rate': completion_rate
            },
            'top_insights': patterns.get('predictive_insights', [])[:3],
            'risk_equipment': list(patterns.get('failure_patterns', {}).get('high_risk_equipment', {}).keys())[:5],
            'cost_trend': patterns.get('cost_patterns', {}).get('cost_trend', 'unknown'),
            'recommendations': self._generate_executive_recommendations(patterns)
        }
        
        return summary
    
    def _generate_executive_recommendations(self, patterns: Dict) -> List[str]:
        """Generate executive recommendations from patterns"""
        
        recommendations = []
        
        # Cost recommendations
        cost_trend = patterns.get('cost_patterns', {}).get('cost_trend')
        if cost_trend == 'increasing':
            recommendations.append("Cost trend is increasing. Review preventive maintenance strategy.")
        
        # Maintenance recommendations
        completion_rate = patterns.get('maintenance_patterns', {}).get('completion_rate', 0)
        if completion_rate < 70:
            recommendations.append(f"Maintenance completion rate is {completion_rate:.1f}%. Increase resource allocation.")
        
        # High-risk equipment
        high_risk = patterns.get('failure_patterns', {}).get('high_risk_equipment', {})
        if len(high_risk) > 3:
            recommendations.append(f"Monitor {len(high_risk)} high-risk equipment units closely.")
        
        return recommendations[:5]


class AutomatedReportScheduler:
    """
    Schedule and generate automated reports
    """
    
    def __init__(self, db_client, report_exporter):
        self.db = db_client
        self.report_exporter = report_exporter
        self.schedules_collection = self.db.report_schedules
    
    async def create_schedule(
        self,
        report_type: str,
        frequency: str,  # daily, weekly, monthly
        recipients: List[str],
        parameters: Dict = None
    ) -> str:
        """Create automated report schedule"""
        
        import uuid
        
        schedule_id = str(uuid.uuid4())
        
        schedule = {
            'id': schedule_id,
            'report_type': report_type,
            'frequency': frequency,
            'recipients': recipients,
            'parameters': parameters or {},
            'created_at': datetime.now().isoformat(),
            'active': True,
            'last_run': None,
            'next_run': self._calculate_next_run(frequency)
        }
        
        await self.schedules_collection.insert_one(schedule)
        
        return schedule_id
    
    def _calculate_next_run(self, frequency: str) -> str:
        """Calculate next run time based on frequency"""
        
        now = datetime.now()
        
        if frequency == 'daily':
            next_run = now + timedelta(days=1)
        elif frequency == 'weekly':
            next_run = now + timedelta(weeks=1)
        elif frequency == 'monthly':
            next_run = now + timedelta(days=30)
        else:
            next_run = now + timedelta(days=1)
        
        return next_run.isoformat()
    
    async def get_due_schedules(self) -> List[Dict]:
        """Get schedules that are due to run"""
        
        now = datetime.now().isoformat()
        
        schedules = await self.schedules_collection.find({
            'active': True,
            'next_run': {'$lte': now}
        }).to_list(100)
        
        return schedules
    
    async def execute_schedule(self, schedule_id: str) -> Dict:
        """Execute a scheduled report"""
        
        schedule = await self.schedules_collection.find_one({'id': schedule_id})
        
        if not schedule:
            raise ValueError(f"Schedule {schedule_id} not found")
        
        # Generate report based on type
        report_type = schedule['report_type']
        parameters = schedule.get('parameters', {})
        
        if report_type == 'executive_summary':
            report = await self.report_exporter.generate_executive_summary(
                days=parameters.get('days', 30)
            )
        elif report_type == 'trend_analysis':
            report = await self.report_exporter.generate_trend_report(
                equipment_id=parameters.get('equipment_id'),
                days=parameters.get('days', 90)
            )
        else:
            raise ValueError(f"Unsupported report type: {report_type}")
        
        # Update schedule
        await self.schedules_collection.update_one(
            {'id': schedule_id},
            {
                '$set': {
                    'last_run': datetime.now().isoformat(),
                    'next_run': self._calculate_next_run(schedule['frequency'])
                }
            }
        )
        
        # In production, would send to recipients via email
        # For now, just return the report
        return {
            'schedule_id': schedule_id,
            'executed_at': datetime.now().isoformat(),
            'report': report,
            'recipients': schedule['recipients']
        }
