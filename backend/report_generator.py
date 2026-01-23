"""Automated Report Generation System"""
from datetime import datetime
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
import json


class ReportTemplate(BaseModel):
    """Template for automated reports"""
    report_id: str
    report_type: str  # 'dispatch', 'technical', 'executive'
    title: str
    generated_from_prediction: str
    generated_at: str
    

class TechnicianDispatchReport:
    """Generate technician dispatch reports"""
    
    def __init__(self, prediction_data: Dict[str, Any], analytics: Dict[str, Any]):
        self.prediction = prediction_data
        self.analytics = analytics
    
    def generate(self) -> Dict[str, Any]:
        """Generate dispatch-ready report"""
        
        report_id = f"DISPATCH-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        report = {
            'report_id': report_id,
            'report_type': 'technician_dispatch',
            'report_number': f"RPT-{datetime.now().strftime('%Y%m%d%H%M')}",
            'generated_from': self.prediction.get('id', ''),
            'generated_at': datetime.now().isoformat(),
            'status': 'generated',
            
            # Executive Summary
            'executive_summary': self._generate_executive_summary(),
            
            # Equipment Details
            'equipment': {
                'id': self.prediction.get('equipment_id', ''),
                'name': self.prediction.get('equipment', {}).get('name', 'Unknown'),
                'code': self.prediction.get('equipment', {}).get('equipment_code', 'N/A'),
                'type': self.prediction.get('equipment', {}).get('equipment_type', 'N/A'),
                'location': self.prediction.get('equipment', {}).get('location_gps', {})
            },
            
            # Prediction Details
            'prediction_details': {
                'confidence': self.prediction.get('confidence_score', 0),
                'health_score': self.prediction.get('health_score', 0),
                'time_to_failure_hours': self.prediction.get('time_to_failure_hours', 0),
                'urgency': self.prediction.get('maintenance_urgency', 'medium'),
                'failure_types': self.prediction.get('failure_types', [])
            },
            
            # Impact Analysis
            'impact_analysis': self.analytics.get('impact_analysis', {}),
            
            # Required Actions
            'required_actions': self.analytics.get('recommendations', []),
            
            # Resource Requirements
            'resources': self.analytics.get('resource_requirements', {}),
            
            # Schedule
            'schedule': self.analytics.get('timeline_schedule', {}),
            
            # Parts Required (auto-filled from inventory analysis)
            'parts_required': self._identify_required_parts(),
            
            # Technician Assignment (to be filled)
            'assigned_technician': None,
            'assignment_criteria': self.analytics.get('resource_requirements', {}).get('required_skills', []),
            
            # Safety Instructions
            'safety_instructions': self._generate_safety_instructions(),
            
            # Metadata
            'metadata': {
                'auto_generated': True,
                'requires_approval': self.prediction.get('maintenance_urgency') == 'critical',
                'dispatch_ready': True,
                'created_by': 'Vida AI Analytics Engine'
            }
        }
        
        return report
    
    def _generate_executive_summary(self) -> str:
        """Generate executive summary"""
        
        equipment_name = self.prediction.get('equipment', {}).get('name', 'Equipment')
        urgency = self.prediction.get('maintenance_urgency', 'medium')
        confidence = self.prediction.get('confidence_score', 0)
        time_to_failure = self.prediction.get('time_to_failure_hours', 0)
        
        failure_desc = "potential failure detected"
        if self.prediction.get('failure_types'):
            failure_type = self.prediction.get('failure_types')[0].get('type', '')
            failure_desc = f"{failure_type} detected"
        
        impact = self.analytics.get('impact_analysis', {})
        cost = impact.get('total_financial_impact', 0)
        downtime = impact.get('downtime_hours', 0)
        
        summary = f"""
{urgency.upper()} PRIORITY: {equipment_name} requires immediate attention.

Prediction Confidence: {confidence}%
Time to Failure: {time_to_failure} hours
Issue: {failure_desc}

Estimated Impact:
- Financial: ${cost:,.2f}
- Downtime: {downtime} hours
- Production Loss: {impact.get('production_loss', 0)} units

Recommendation: {self.analytics.get('recommendations', ['Schedule maintenance'])[0]}
"""
        
        return summary.strip()
    
    def _identify_required_parts(self) -> List[Dict[str, Any]]:
        """Identify required parts based on failure type"""
        
        parts = []
        failure_types = self.prediction.get('failure_types', [])
        
        # Map failure types to common parts
        parts_mapping = {
            'bearing': [
                {'part_number': 'BRG-001', 'name': 'Main Bearing Assembly', 'quantity': 1, 'priority': 'high'},
                {'part_number': 'LUB-050', 'name': 'Bearing Lubricant', 'quantity': 2, 'priority': 'medium'}
            ],
            'motor': [
                {'part_number': 'MTR-200', 'name': 'Motor Starter', 'quantity': 1, 'priority': 'high'},
                {'part_number': 'ELC-100', 'name': 'Electrical Connectors Kit', 'quantity': 1, 'priority': 'medium'}
            ],
            'pump': [
                {'part_number': 'PMP-300', 'name': 'Pump Impeller', 'quantity': 1, 'priority': 'high'},
                {'part_number': 'SEAL-400', 'name': 'Seal Kit', 'quantity': 1, 'priority': 'high'}
            ]
        }
        
        for failure in failure_types:
            failure_type = failure.get('type', '').lower()
            for key, part_list in parts_mapping.items():
                if key in failure_type:
                    parts.extend(part_list)
        
        # Add generic parts if no specific failures identified
        if not parts:
            parts = [
                {'part_number': 'GEN-100', 'name': 'Standard Maintenance Kit', 'quantity': 1, 'priority': 'medium'}
            ]
        
        return parts
    
    def _generate_safety_instructions(self) -> List[str]:
        """Generate safety instructions based on equipment type"""
        
        equipment_type = self.prediction.get('equipment', {}).get('equipment_type', '').lower()
        urgency = self.prediction.get('maintenance_urgency', 'medium')
        
        safety_instructions = [
            "Lock out / Tag out (LOTO) procedures must be followed",
            "Verify equipment is completely de-energized before starting work",
            "Wear appropriate PPE: safety glasses, gloves, steel-toed boots"
        ]
        
        if urgency in ['critical', 'high']:
            safety_instructions.insert(0, "URGENT: Notify supervisor before starting work")
        
        if 'electrical' in equipment_type or 'motor' in equipment_type:
            safety_instructions.append("Use insulated tools for electrical work")
            safety_instructions.append("Verify zero electrical potential with multimeter")
        
        if 'hydraulic' in equipment_type or 'pump' in equipment_type:
            safety_instructions.append("Depressurize hydraulic system before disassembly")
            safety_instructions.append("Have spill containment ready for fluid leaks")
        
        return safety_instructions


class ReportDispatcher:
    """Handle report dispatching and work order creation"""
    
    @staticmethod
    def auto_assign_technician(report: Dict[str, Any], available_technicians: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Auto-assign best matching technician"""
        
        required_skills = set(report.get('resources', {}).get('required_skills', []))
        urgency = report.get('prediction_details', {}).get('urgency', 'medium')
        
        # Score technicians
        best_match = None
        best_score = 0
        
        for tech in available_technicians:
            if tech.get('status') != 'available':
                continue
            
            tech_skills = set(tech.get('skills', []))
            skill_match = len(required_skills & tech_skills) / len(required_skills) if required_skills else 0
            
            # Bonus for experience with critical issues
            experience_bonus = 0.2 if urgency in ['critical', 'high'] and tech.get('experience_years', 0) > 5 else 0
            
            score = skill_match + experience_bonus
            
            if score > best_score:
                best_score = score
                best_match = tech
        
        return best_match
    
    @staticmethod
    def create_work_order_from_report(report: Dict[str, Any]) -> Dict[str, Any]:
        """Create work order data structure from report"""
        
        work_order = {
            'work_order_number': f"WO-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'title': f"Predictive Maintenance: {report.get('equipment', {}).get('name', 'Unknown')}",
            'description': report.get('executive_summary', ''),
            'equipment_id': report.get('equipment', {}).get('id'),
            'prediction_id': report.get('generated_from'),
            'prediction_source': report.get('generated_from'),  # New column
            'auto_generated': True,  # New column
            'priority': report.get('prediction_details', {}).get('urgency', 'medium'),
            'status': 'pending',
            'work_type': 'predictive_maintenance',
            'parts_required': report.get('parts_required', []),
            'estimated_cost': report.get('impact_analysis', {}).get('total_financial_impact', 0),
            'scheduled_start': report.get('schedule', {}).get('recommended_start'),
            'notes': json.dumps({
                'safety_instructions': report.get('safety_instructions', []),
                'required_actions': report.get('required_actions', []),
                'analytics_summary': report.get('impact_analysis', {})
            }),
            'created_at': datetime.now().isoformat(),
            'created_by': 'Vida AI'
        }
        
        return work_order
