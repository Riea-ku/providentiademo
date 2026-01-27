"""
AI Analytics Simulation Engine
Handles 6-step simulation workflow with real-time progress tracking
Now supports 20+ dynamic demo cases from database
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import random

from analytics_engine import AnalyticsEngine
from report_generator import TechnicianDispatchReport, ReportDispatcher


# ============================================================================
# MODELS
# ============================================================================

class SimulationStep(BaseModel):
    step_number: int
    step_name: str
    status: str = "waiting"  # waiting, processing, complete, error
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    details: Optional[str] = None


class SimulationRun(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    failure_mode: str
    equipment_id: str
    prediction_id: Optional[str] = None
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    status: str = "running"  # running, complete, error
    current_step: int = 0
    steps: List[SimulationStep] = []
    
    # Results from each step
    prediction_data: Optional[Dict[str, Any]] = None
    analytics_data: Optional[Dict[str, Any]] = None
    report_data: Optional[Dict[str, Any]] = None
    inventory_data: Optional[Dict[str, Any]] = None
    dispatch_data: Optional[Dict[str, Any]] = None
    notifications_data: Optional[Dict[str, Any]] = None


class SimulationRequest(BaseModel):
    failure_mode: str  # e.g., bearing_wear, motor_overheat, or prediction_id like DEMO-PRED-001
    equipment_id: str = "pump-001"
    run_full_cycle: bool = True
    prediction_id: Optional[str] = None  # If provided, load from demo_predictions


# ============================================================================
# FALLBACK FAILURE MODE TEMPLATES (used if no demo prediction found)
# ============================================================================

FAILURE_MODE_TEMPLATES = {
    "bearing_wear": {
        "name": "Bearing Wear",
        "severity": "critical",
        "confidence_score": 92.5,
        "health_score": 65,
        "time_to_failure_hours": 72,
        "maintenance_urgency": "high",
        "estimated_cost": 3500,
        "sensor_data": {
            "motor_temp": 88,
            "vibration": 15.2,
            "power_output": 72,
            "flow_rate": 42,
            "noise_level": 85
        },
        "description": "Excessive bearing wear detected - high vibration and temperature",
        "required_skills": ["mechanical_maintenance", "hydraulics", "bearing_replacement"]
    },
    "motor_overheat": {
        "name": "Motor Overheat",
        "severity": "high",
        "confidence_score": 88.3,
        "health_score": 58,
        "time_to_failure_hours": 48,
        "maintenance_urgency": "critical",
        "estimated_cost": 5200,
        "sensor_data": {
            "motor_temp": 105,
            "vibration": 8.5,
            "power_output": 65,
            "flow_rate": 38,
            "cooling_efficiency": 45
        },
        "description": "Motor temperature exceeding safe limits - cooling system failure",
        "required_skills": ["electrical_systems", "motor_repair", "thermal_management"]
    },
    "pump_cavitation": {
        "name": "Pump Cavitation",
        "severity": "medium",
        "confidence_score": 85.7,
        "health_score": 70,
        "time_to_failure_hours": 120,
        "maintenance_urgency": "medium",
        "estimated_cost": 2800,
        "sensor_data": {
            "motor_temp": 75,
            "vibration": 12.8,
            "power_output": 68,
            "flow_rate": 35,
            "suction_pressure": 8.5
        },
        "description": "Cavitation detected - low suction pressure and irregular flow",
        "required_skills": ["hydraulics", "pump_maintenance", "flow_diagnostics"]
    }
}


# ============================================================================
# SIMULATION ENGINE
# ============================================================================

class SimulationEngine:
    """
    Executes 6-step simulation process:
    1. Generate AI prediction
    2. Run analytics & impact assessment
    3. Generate automated report
    4. Check inventory & reserve parts
    5. Assign technician & create work order
    6. Send notifications & finalize
    """
    
    def __init__(self, db_client, websocket_manager, mongo_db=None):
        self.db = db_client
        self.ws_manager = websocket_manager
        self.mongo_db = mongo_db if mongo_db is not None else db_client  # Proper None check for MongoDB
        
    async def run_simulation(self, request: SimulationRequest) -> SimulationRun:
        """Execute full simulation cycle"""
        
        # Initialize simulation
        simulation = SimulationRun(
            failure_mode=request.failure_mode,
            equipment_id=request.equipment_id,
            prediction_id=request.prediction_id,
            steps=[
                SimulationStep(step_number=1, step_name="AI Generates Failure Prediction"),
                SimulationStep(step_number=2, step_name="Analytics & Impact Assessment"),
                SimulationStep(step_number=3, step_name="Report Auto-Generation"),
                SimulationStep(step_number=4, step_name="Inventory Check & Reservation"),
                SimulationStep(step_number=5, step_name="Technician Auto-Dispatch"),
                SimulationStep(step_number=6, step_name="Notifications Sent")
            ]
        )
        
        # Store simulation
        await self.db.ai_simulations.insert_one(simulation.dict())
        
        try:
            # Execute each step
            await self.step_1_generate_prediction(simulation, request)
            await self.step_2_run_analytics(simulation)
            await self.step_3_generate_report(simulation)
            await self.step_4_check_inventory(simulation)
            await self.step_5_dispatch_technician(simulation)
            await self.step_6_send_notifications(simulation)
            
            # Mark as complete
            simulation.status = "complete"
            simulation.completed_at = datetime.now(timezone.utc).isoformat()
            
            # Update in database
            await self.db.ai_simulations.update_one(
                {"id": simulation.id},
                {"$set": simulation.dict()}
            )
            
            # Send final update
            await self.ws_manager.broadcast(simulation.id, {
                "type": "simulation_complete",
                "simulation": simulation.dict()
            })
            
        except Exception as e:
            simulation.status = "error"
            simulation.completed_at = datetime.now(timezone.utc).isoformat()
            await self.db.ai_simulations.update_one(
                {"id": simulation.id},
                {"$set": simulation.dict()}
            )
            raise
        
        return simulation
    
    async def _load_demo_prediction(self, prediction_id: str) -> Optional[Dict]:
        """Load a demo prediction from the database"""
        try:
            # Try by ID first
            prediction = await self.mongo_db.demo_predictions.find_one(
                {"id": prediction_id}, {"_id": 0}
            )
            if prediction:
                return prediction
            
            # Try by failure_mode
            prediction = await self.mongo_db.demo_predictions.find_one(
                {"failure_mode": prediction_id}, {"_id": 0}
            )
            return prediction
        except Exception as e:
            print(f"Error loading demo prediction: {e}")
            return None
    
    async def step_1_generate_prediction(self, simulation: SimulationRun, request: SimulationRequest):
        """Step 1: Generate synthetic prediction based on failure mode or load from database"""
        step = simulation.steps[0]
        step.status = "processing"
        step.started_at = datetime.now(timezone.utc).isoformat()
        simulation.current_step = 1
        
        await self._update_and_broadcast(simulation, step, "Generating AI prediction...")
        await asyncio.sleep(1.5)  # Simulate processing
        
        # Try to load from demo predictions first
        demo_pred = None
        
        # Check if prediction_id provided
        if request.prediction_id:
            demo_pred = await self._load_demo_prediction(request.prediction_id)
        
        # If not found, try failure_mode as ID or lookup
        if not demo_pred:
            demo_pred = await self._load_demo_prediction(request.failure_mode)
        
        # If still not found, use fallback templates
        if demo_pred:
            # Use demo prediction data
            prediction = {
                "id": demo_pred.get("id", f"PRED-SIM-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                "equipment_id": demo_pred.get("equipment_id", simulation.equipment_id),
                "equipment_code": f"EQ-{demo_pred.get('equipment_id', simulation.equipment_id).upper()}",
                "equipment_name": demo_pred.get("equipment_name", "Unknown Equipment"),
                "predicted_failure": demo_pred.get("predicted_failure", demo_pred.get("failure_mode", "Unknown")),
                "confidence_score": demo_pred.get("confidence_score", 85.0),
                "health_score": demo_pred.get("health_score", 65),
                "time_to_failure_hours": demo_pred.get("time_to_failure_hours", 72),
                "maintenance_urgency": demo_pred.get("maintenance_urgency", "high"),
                "severity": demo_pred.get("severity", "high"),
                "estimated_cost": demo_pred.get("estimated_cost", 3000),
                "sensor_data": demo_pred.get("sensor_data", {}),
                "description": demo_pred.get("description", ""),
                "predicted_date": (datetime.now(timezone.utc) + timedelta(hours=demo_pred.get("time_to_failure_hours", 72))).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        else:
            # Fallback to static templates
            template = FAILURE_MODE_TEMPLATES.get(request.failure_mode, FAILURE_MODE_TEMPLATES["bearing_wear"])
            
            prediction = {
                "id": f"PRED-SIM-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "equipment_id": simulation.equipment_id,
                "equipment_code": f"EQ-{simulation.equipment_id.upper()}",
                "equipment_name": f"Equipment {simulation.equipment_id}",
                "predicted_failure": template["name"],
                "confidence_score": template["confidence_score"],
                "health_score": template["health_score"],
                "time_to_failure_hours": template["time_to_failure_hours"],
                "maintenance_urgency": template["maintenance_urgency"],
                "severity": template["severity"],
                "estimated_cost": template["estimated_cost"],
                "sensor_data": template["sensor_data"],
                "description": template.get("description", ""),
                "predicted_date": (datetime.now(timezone.utc) + timedelta(hours=template["time_to_failure_hours"])).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        
        simulation.prediction_data = prediction
        
        step.status = "complete"
        step.completed_at = datetime.now(timezone.utc).isoformat()
        step.result = {"prediction_id": prediction["id"]}
        step.details = f"Predicted: {prediction['predicted_failure']} with {prediction['confidence_score']}% confidence"
        
        await self._update_and_broadcast(simulation, step, f"✅ Prediction generated: {prediction['predicted_failure']}")
    
    async def step_2_run_analytics(self, simulation: SimulationRun):
        """Step 2: Run analytics engine"""
        step = simulation.steps[1]
        step.status = "processing"
        step.started_at = datetime.now(timezone.utc).isoformat()
        simulation.current_step = 2
        
        await self._update_and_broadcast(simulation, step, "Running AI analytics engine...")
        await asyncio.sleep(2)  # Simulate AI processing
        
        # Generate analytics
        engine = AnalyticsEngine(simulation.prediction_data)
        analytics_package = engine.generate_analytics_package()
        
        # Extract impact details before converting to dict (impact_analysis is a dict)
        impact = analytics_package.impact_analysis.get('total_financial_impact', 0)
        downtime = analytics_package.impact_analysis.get('downtime_hours', 0)
        
        analytics_data = {
            "id": f"ANALYTICS-{simulation.prediction_data['id']}",
            "prediction_id": simulation.prediction_data['id'],
            "analytics_package": analytics_package.dict(),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        simulation.analytics_data = analytics_data
        
        step.status = "complete"
        step.completed_at = datetime.now(timezone.utc).isoformat()
        step.result = {"analytics_id": analytics_data["id"]}
        step.details = f"Impact: ${impact:,.0f}, Downtime: {downtime}h"
        
        await self._update_and_broadcast(simulation, step, "✅ Analytics complete - impact assessed")
    
    async def step_3_generate_report(self, simulation: SimulationRun):
        """Step 3: Auto-generate dispatch report"""
        step = simulation.steps[2]
        step.status = "processing"
        step.started_at = datetime.now(timezone.utc).isoformat()
        simulation.current_step = 3
        
        await self._update_and_broadcast(simulation, step, "Generating automated report...")
        await asyncio.sleep(1)
        
        # Generate report
        report_generator = TechnicianDispatchReport(
            simulation.prediction_data,
            simulation.analytics_data["analytics_package"]
        )
        report = report_generator.generate()
        
        simulation.report_data = report
        
        step.status = "complete"
        step.completed_at = datetime.now(timezone.utc).isoformat()
        step.result = {"report_id": report["report_id"]}
        step.details = f"Report generated: {len(report.get('parts_requirements', []))} parts identified"
        
        await self._update_and_broadcast(simulation, step, "✅ Dispatch report ready")
    
    async def step_4_check_inventory(self, simulation: SimulationRun):
        """Step 4: Check inventory and reserve parts"""
        step = simulation.steps[3]
        step.status = "processing"
        step.started_at = datetime.now(timezone.utc).isoformat()
        simulation.current_step = 4
        
        await self._update_and_broadcast(simulation, step, "Checking inventory...")
        await asyncio.sleep(1.5)
        
        # Simulate inventory check
        parts_needed = simulation.report_data.get("parts_requirements", [])
        
        inventory_status = {
            "total_parts_needed": len(parts_needed),
            "available_parts": random.randint(max(0, len(parts_needed) - 2), len(parts_needed)),
            "reserved_parts": [],
            "parts_to_order": [],
            "estimated_delivery": "2-3 days",
            "inventory_value": simulation.prediction_data.get("estimated_cost", 0) * 0.6
        }
        
        # Randomly determine which parts are available
        for part in parts_needed[:inventory_status["available_parts"]]:
            inventory_status["reserved_parts"].append({
                "part_name": part.get("part", "Unknown"),
                "quantity": part.get("quantity", 1),
                "status": "reserved"
            })
        
        if len(parts_needed) > inventory_status["available_parts"]:
            for part in parts_needed[inventory_status["available_parts"]:]:
                inventory_status["parts_to_order"].append({
                    "part_name": part.get("part", "Unknown"),
                    "quantity": part.get("quantity", 1),
                    "status": "to_order"
                })
        
        simulation.inventory_data = inventory_status
        
        step.status = "complete"
        step.completed_at = datetime.now(timezone.utc).isoformat()
        step.result = inventory_status
        step.details = f"{inventory_status['available_parts']}/{inventory_status['total_parts_needed']} parts available"
        
        await self._update_and_broadcast(simulation, step, "✅ Inventory checked - parts reserved")
    
    async def step_5_dispatch_technician(self, simulation: SimulationRun):
        """Step 5: Auto-assign technician and create work order"""
        step = simulation.steps[4]
        step.status = "processing"
        step.started_at = datetime.now(timezone.utc).isoformat()
        simulation.current_step = 5
        
        await self._update_and_broadcast(simulation, step, "Assigning technician...")
        await asyncio.sleep(1.5)
        
        # Get available technicians
        available_technicians = [
            {
                "id": "tech-001",
                "employee_id": "EMP-001",
                "first_name": "John",
                "last_name": "Smith",
                "skills": ["mechanical_maintenance", "hydraulics", "bearing_replacement"],
                "status": "available",
                "experience_years": 8,
                "current_workload": 2
            },
            {
                "id": "tech-002",
                "employee_id": "EMP-002",
                "first_name": "Sarah",
                "last_name": "Johnson",
                "skills": ["electrical_systems", "motor_repair", "thermal_management"],
                "status": "available",
                "experience_years": 6,
                "current_workload": 1
            },
            {
                "id": "tech-003",
                "employee_id": "EMP-003",
                "first_name": "Mike",
                "last_name": "Chen",
                "skills": ["hydraulics", "pump_maintenance", "flow_diagnostics"],
                "status": "available",
                "experience_years": 10,
                "current_workload": 3
            }
        ]
        
        # Auto-assign best technician
        assigned_tech = ReportDispatcher.auto_assign_technician(
            simulation.report_data,
            available_technicians
        )
        
        # Create work order
        work_order = {
            "id": str(uuid.uuid4()),
            "prediction_id": simulation.prediction_data["id"],
            "equipment_id": simulation.equipment_id,
            "assigned_technician_id": assigned_tech["id"],
            "technician_name": f"{assigned_tech['first_name']} {assigned_tech['last_name']}",
            "priority": simulation.prediction_data.get("maintenance_urgency", "medium"),
            "estimated_hours": simulation.analytics_data["analytics_package"]["resource_requirements"]["estimated_hours"],
            "status": "assigned",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        simulation.dispatch_data = {
            "work_order": work_order,
            "technician": assigned_tech,
            "skill_match": random.randint(85, 98),
            "estimated_arrival": "2 hours"
        }
        
        step.status = "complete"
        step.completed_at = datetime.now(timezone.utc).isoformat()
        step.result = {"work_order_id": work_order["id"]}
        step.details = f"Assigned to {assigned_tech['first_name']} {assigned_tech['last_name']} ({assigned_tech['experience_years']}y exp)"
        
        await self._update_and_broadcast(simulation, step, f"✅ Technician assigned: {assigned_tech['first_name']} {assigned_tech['last_name']}")
    
    async def step_6_send_notifications(self, simulation: SimulationRun):
        """Step 6: Send notifications to stakeholders"""
        step = simulation.steps[5]
        step.status = "processing"
        step.started_at = datetime.now(timezone.utc).isoformat()
        simulation.current_step = 6
        
        await self._update_and_broadcast(simulation, step, "Sending notifications...")
        await asyncio.sleep(1)
        
        # Simulate notification sending
        notifications = {
            "technician_notified": True,
            "manager_notified": True,
            "operations_notified": True,
            "notification_channels": ["email", "sms", "app_push"],
            "total_notifications_sent": 5,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
        
        simulation.notifications_data = notifications
        
        step.status = "complete"
        step.completed_at = datetime.now(timezone.utc).isoformat()
        step.result = notifications
        step.details = f"{notifications['total_notifications_sent']} notifications sent via {len(notifications['notification_channels'])} channels"
        
        await self._update_and_broadcast(simulation, step, "✅ All stakeholders notified")
    
    async def _update_and_broadcast(self, simulation: SimulationRun, step: SimulationStep, message: str):
        """Update database and broadcast to WebSocket clients"""
        # Update in database
        await self.db.ai_simulations.update_one(
            {"id": simulation.id},
            {"$set": simulation.dict()}
        )
        
        # Broadcast to WebSocket clients
        await self.ws_manager.broadcast(simulation.id, {
            "type": "step_update",
            "simulation_id": simulation.id,
            "step": step.dict(),
            "message": message,
            "current_step": simulation.current_step
        })


# ============================================================================
# WEBSOCKET MANAGER
# ============================================================================

class WebSocketManager:
    """Manages WebSocket connections for simulation updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, List] = {}
    
    async def connect(self, simulation_id: str, websocket):
        """Connect a WebSocket client"""
        await websocket.accept()
        if simulation_id not in self.active_connections:
            self.active_connections[simulation_id] = []
        self.active_connections[simulation_id].append(websocket)
    
    def disconnect(self, simulation_id: str, websocket):
        """Disconnect a WebSocket client"""
        if simulation_id in self.active_connections:
            self.active_connections[simulation_id].remove(websocket)
            if not self.active_connections[simulation_id]:
                del self.active_connections[simulation_id]
    
    async def broadcast(self, simulation_id: str, message: dict):
        """Broadcast message to all connected clients for a simulation"""
        if simulation_id in self.active_connections:
            for connection in self.active_connections[simulation_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to client: {e}")
