from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import json
import asyncio

# Import analytics modules
from analytics_engine import AnalyticsEngine, AnalyticsChatbot
from report_generator import TechnicianDispatchReport, ReportDispatcher
from emergentintegrations.llm.chat import LlmChat, UserMessage
from simulation_engine import SimulationEngine, SimulationRequest, SimulationRun, WebSocketManager

# Import new database manager
from db_manager import db_manager

# Import new services
from embedding_service import embedding_service
from services.report_storage import ReportStorageService
from services.event_orchestrator import EventOrchestratorService
from services.historical_chatbot import HistoricalAwareChatbot
from services.pattern_recognizer import PatternRecognizerService
from services.intelligent_report_generator import IntelligentReportGenerator

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Global services (will be initialized on startup)
report_storage_service = None
event_orchestrator_service = None
historical_chatbot_service = None
pattern_recognizer_service = None
intelligent_report_generator = None

# Create the main app without a prefix
app = FastAPI(title="Vida AI Predictive Analytics API", version="3.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize WebSocket Manager and Simulation Engine
ws_manager = WebSocketManager()

# Note: Historical Intelligence services will be initialized after database connection
# See @app.on_event("startup") below


# ============================================================================
# MODELS
# ============================================================================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class PredictionAnalyticsRequest(BaseModel):
    prediction_id: str
    auto_generate_report: bool = True
    dispatch_technician: bool = False

class AnalyticsQuery(BaseModel):
    query: str
    analytics_id: Optional[str] = None

class ReportGenerationRequest(BaseModel):
    analytics_id: str
    report_type: str = "dispatch"  # dispatch, technical, executive
    auto_assign: bool = True

class DispatchRequest(BaseModel):
    report_id: str
    technician_id: Optional[str] = None
    notes: Optional[str] = None

class ChatMessageRequest(BaseModel):
    message: str
    session_id: str
    context: Optional[Dict[str, Any]] = None


# ============================================================================
# BASIC ENDPOINTS
# ============================================================================

@api_router.get("/")
async def root():
    return {
        "message": "Vida AI Predictive Analytics & Automated Reporting System",
        "version": "3.0.0",
        "status": "operational"
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",
        "llm": "available" if EMERGENT_LLM_KEY else "not_configured",
        "timestamp": datetime.now().isoformat()
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# ============================================================================
# PREDICTIVE ANALYTICS ENDPOINTS
# ============================================================================

@api_router.post("/predictions/{prediction_id}/generate-analytics")
async def generate_analytics(prediction_id: str, background_tasks: BackgroundTasks):
    """
    Generate analytics from a prediction
    Triggers: Analytics Engine → Report Generation → Optional Dispatch
    """
    try:
        # This would query Supabase in production
        # For now, return mock analytics that frontend can use
        logger.info(f"Generating analytics for prediction: {prediction_id}")
        
        # Simulated prediction data (in production, fetch from Supabase)
        mock_prediction = {
            "id": prediction_id,
            "equipment_id": "eq-123",
            "equipment": {
                "name": "Solar Pump A",
                "equipment_code": "SP-001",
                "equipment_type": "solar_pump",
                "last_service_date": "2025-05-15"
            },
            "confidence_score": 92,
            "health_score": 68,
            "time_to_failure_hours": 168,
            "maintenance_urgency": "high",
            "estimated_cost": 5000,
            "failure_types": [
                {"type": "Bearing Wear", "severity": "critical"}
            ],
            "sensor_data": {
                "motor_temp": 85,
                "vibration": 12.5,
                "power_output": 75,
                "flow_rate": 45
            }
        }
        
        # Generate analytics
        engine = AnalyticsEngine(mock_prediction)
        analytics_package = engine.generate_analytics_package()
        
        # Store in MongoDB (simulating Supabase storage)
        analytics_doc = {
            "id": str(uuid.uuid4()),
            "prediction_id": prediction_id,
            "analytics_package": analytics_package.dict(),
            "generated_at": datetime.now().isoformat(),
            "report_generated": False,
            "dispatched": False
        }
        
        # Make a copy to avoid ObjectId issues
        analytics_to_store = analytics_doc.copy()
        result = await db.prediction_analytics.insert_one(analytics_to_store)
        
        return {
            "success": True,
            "analytics_id": analytics_doc["id"],
            "analytics_package": analytics_package.dict(),
            "report_ready": True,
            "message": "Analytics generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/{analytics_id}")
async def get_analytics(analytics_id: str):
    """Get analytics package by ID"""
    try:
        analytics = await db.prediction_analytics.find_one({"id": analytics_id})
        if not analytics:
            raise HTTPException(status_code=404, detail="Analytics not found")
        
        # Remove MongoDB _id for JSON serialization
        analytics.pop("_id", None)
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/analytics/{analytics_id}/explain")
async def explain_analytics(analytics_id: str, query: Optional[AnalyticsQuery] = None):
    """
    Get AI-powered explanation of analytics
    Uses Claude Sonnet 4.5 for structured reasoning
    """
    try:
        # Fetch analytics
        analytics = await db.prediction_analytics.find_one({"id": analytics_id})
        if not analytics:
            raise HTTPException(status_code=404, detail="Analytics not found")
        
        # Get prediction data
        prediction_id = analytics.get("prediction_id")
        
        # Simulated prediction data (fetch from Supabase in production)
        mock_prediction = {
            "id": prediction_id,
            "equipment": {
                "name": "Solar Pump A",
                "equipment_code": "SP-001",
                "equipment_type": "solar_pump"
            },
            "confidence_score": 92,
            "health_score": 68,
            "time_to_failure_hours": 168,
            "maintenance_urgency": "high",
            "sensor_data": {
                "motor_temp": 85,
                "vibration": 12.5,
                "power_output": 75
            }
        }
        
        # Generate explanation using AI
        chatbot = AnalyticsChatbot(EMERGENT_LLM_KEY)
        
        if query and query.query:
            # Answer specific question
            explanation = await chatbot.answer_analytics_query(
                query.query,
                analytics.get("analytics_package", {})
            )
        else:
            # Generate full explanation
            explanation = await chatbot.explain_prediction(
                mock_prediction,
                analytics.get("analytics_package", {})
            )
        
        return {
            "success": True,
            "explanation": explanation,
            "analytics_id": analytics_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error explaining analytics: {str(e)}")
        return {
            "success": False,
            "explanation": f"Analytics available but explanation generation is unavailable. Key findings: {analytics.get('analytics_package', {}).get('recommendations', ['See analytics data'])}",
            "error": str(e)
        }


# ============================================================================
# REPORT GENERATION ENDPOINTS
# ============================================================================

@api_router.post("/analytics/{analytics_id}/generate-report")
async def generate_report(analytics_id: str, request: Optional[ReportGenerationRequest] = None):
    """
    Generate automated report from analytics
    Auto-populates all fields based on analytics data
    """
    try:
        # Fetch analytics
        analytics = await db.prediction_analytics.find_one({"id": analytics_id}, {"_id": 0})
        if not analytics:
            raise HTTPException(status_code=404, detail="Analytics not found")
        
        # Fetch actual prediction data
        prediction_id = analytics.get("prediction_id")
        prediction = await db.failure_predictions.find_one({"id": prediction_id}, {"_id": 0})
        
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction data not found")
        
        # Generate report using intelligent report generator
        report_id = await intelligent_report_generator.generate_historical_report(
            report_type="technician_dispatch",
            current_data={
                "prediction_id": prediction_id,
                "equipment_id": prediction.get("equipment_id"),
                "equipment_type": prediction.get("equipment_type", "Unknown"),
                "failure_type": prediction.get("predicted_failure_type"),
                "severity": prediction.get("severity", "medium"),
                "confidence_score": prediction.get("confidence_score", 0),
                "health_score": prediction.get("health_score", 100),
                "time_to_failure_hours": prediction.get("time_to_failure_hours", 0),
                "description": f"Automated maintenance report for {prediction.get('equipment_type', 'equipment')}"
            }
        )
        
        # Get the generated report
        report = await report_storage_service.get_report_by_id(report_id)
        
        if not report:
            raise HTTPException(status_code=500, detail="Failed to retrieve generated report")
        
        # Store in automated_reports collection for backward compatibility
        report_doc = {
            "id": report_id,
            "analytics_id": analytics_id,
            "report_type": "technician_dispatch",
            "content": report,
            "generated_for": [],
            "dispatched_to": [],
            "status": "generated",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.automated_reports.insert_one(report_doc)
        
        # Update analytics
        await db.prediction_analytics.update_one(
            {"id": analytics_id},
            {"$set": {"report_generated": True}}
        )
        
        return {
            "success": True,
            "report_id": report_id,
            "report": report,
            "dispatch_ready": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/reports/{report_id}")
async def get_report(report_id: str):
    """Get report by ID"""
    try:
        report = await db.automated_reports.find_one({"id": report_id})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report.pop("_id", None)
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/reports")
async def list_reports(limit: int = 50, status: Optional[str] = None):
    """List all reports with optional filtering"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        reports = await db.automated_reports.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Remove MongoDB _id
        for report in reports:
            report.pop("_id", None)
        
        return {
            "success": True,
            "count": len(reports),
            "reports": reports
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DISPATCH ENDPOINTS
# ============================================================================

@api_router.post("/reports/{report_id}/dispatch")
async def dispatch_report(report_id: str, dispatch_request: Optional[DispatchRequest] = None):
    """
    Dispatch technician based on report
    Creates work order and notifies technician
    """
    try:
        # Fetch report
        report = await db.automated_reports.find_one({"id": report_id})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Get available technicians (simulated)
        available_technicians = [
            {
                "id": "tech-001",
                "employee_id": "EMP-001",
                "first_name": "John",
                "last_name": "Smith",
                "skills": ["mechanical_maintenance", "hydraulics"],
                "status": "available",
                "experience_years": 8
            },
            {
                "id": "tech-002",
                "employee_id": "EMP-002",
                "first_name": "Sarah",
                "last_name": "Johnson",
                "skills": ["mechanical_maintenance", "electrical_systems"],
                "status": "available",
                "experience_years": 6
            }
        ]
        
        # Auto-assign technician
        if dispatch_request and dispatch_request.technician_id:
            assigned_tech = next(
                (t for t in available_technicians if t["id"] == dispatch_request.technician_id),
                None
            )
        else:
            assigned_tech = ReportDispatcher.auto_assign_technician(
                report.get("content", {}),
                available_technicians
            )
        
        if not assigned_tech:
            raise HTTPException(status_code=400, detail="No suitable technician available")
        
        # Create work order
        work_order_data = ReportDispatcher.create_work_order_from_report(report.get("content", {}))
        work_order_data["assigned_technician_id"] = assigned_tech["id"]
        work_order_data["id"] = str(uuid.uuid4())
        
        # Store work order (make copy to avoid ObjectId issues)
        work_order_to_store = work_order_data.copy()
        await db.work_orders.insert_one(work_order_to_store)
        
        # Create dispatch history
        dispatch_log = {
            "id": str(uuid.uuid4()),
            "report_id": report_id,
            "technician_id": assigned_tech["id"],
            "work_order_id": work_order_data["id"],
            "dispatched_at": datetime.now().isoformat(),
            "status": "dispatched",
            "notes": dispatch_request.notes if dispatch_request else None
        }
        
        # Store dispatch log (make copy to avoid ObjectId issues)
        dispatch_log_to_store = dispatch_log.copy()
        await db.dispatch_history.insert_one(dispatch_log_to_store)
        
        # Update report status
        await db.automated_reports.update_one(
            {"id": report_id},
            {
                "$set": {
                    "status": "dispatched",
                    "dispatched_to": [assigned_tech["id"]]
                }
            }
        )
        
        return {
            "success": True,
            "work_order_id": work_order_data["id"],
            "work_order": work_order_data,
            "technician": assigned_tech,
            "dispatch_log_id": dispatch_log["id"],
            "message": f"Dispatched to {assigned_tech['first_name']} {assigned_tech['last_name']}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dispatching report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/dispatch-history")
async def get_dispatch_history(limit: int = 50):
    """Get dispatch history"""
    try:
        history = await db.dispatch_history.find().sort("dispatched_at", -1).limit(limit).to_list(limit)
        
        for item in history:
            item.pop("_id", None)
        
        return {
            "success": True,
            "count": len(history),
            "history": history
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CHATBOT ENDPOINT (Enhanced with Analytics)
# ============================================================================

@api_router.post("/chatbot/message")
async def chatbot_message(request: ChatMessageRequest):
    """
    Enhanced chatbot endpoint with analytics integration
    Automatically provides analytics explanations and recommendations
    """
    try:
        chatbot = AnalyticsChatbot(EMERGENT_LLM_KEY)
        
        # Check if message is about analytics/predictions
        if request.context and request.context.get("analytics_id"):
            # Fetch analytics context
            analytics = await db.prediction_analytics.find_one(
                {"id": request.context["analytics_id"]}
            )
            
            if analytics:
                response = await chatbot.answer_analytics_query(
                    request.message,
                    analytics.get("analytics_package", {})
                )
            else:
                response = "I couldn't find the analytics data you're referring to."
        else:
            # General query
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=request.session_id,
                system_message="You are Vida AI, an intelligent farm management assistant."
            )
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            user_message = UserMessage(text=request.message)
            response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "response": response,
            "session_id": request.session_id
        }
        
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return {
            "success": False,
            "response": "I apologize, but I'm having trouble processing your request right now. Please try again.",
            "error": str(e)
        }



# ============================================================================
# AI ANALYTICS SIMULATION ENDPOINTS (NEW INTERACTIVE SYSTEM)
# ============================================================================

@api_router.post("/ai-analytics/simulate-failure")
async def simulate_failure_cycle(request: SimulationRequest, background_tasks: BackgroundTasks):
    """
    Advanced simulation endpoint with real-time progress tracking
    Executes full 6-step pipeline: Prediction → Analytics → Report → Inventory → Dispatch → Notify
    """
    try:
        logger.info(f"Starting simulation for failure mode: {request.failure_mode}")
        
        # Start simulation in background
        simulation = await simulation_engine.run_simulation(request)
        
        return {
            "success": True,
            "simulation_id": simulation.id,
            "status": simulation.status,
            "message": "Simulation started - connect to WebSocket for live updates",
            "websocket_url": f"/ws/simulation-progress/{simulation.id}"
        }
        
    except Exception as e:
        import traceback
        logger.error(f"Simulation error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/ai-analytics/simulation/{simulation_id}")
async def get_simulation_status(simulation_id: str):
    """Get current status and results of a simulation"""
    try:
        simulation = await db.ai_simulations.find_one({"id": simulation_id})
        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")
        
        simulation.pop("_id", None)
        return {
            "success": True,
            "simulation": simulation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/ai-analytics/simulations")
async def list_simulations(limit: int = 20):
    """List recent simulations"""
    try:
        simulations = await db.ai_simulations.find().sort("started_at", -1).limit(limit).to_list(limit)
        
        for sim in simulations:
            sim.pop("_id", None)
        
        return {
            "success": True,
            "count": len(simulations),
            "simulations": simulations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WEBSOCKET ENDPOINT FOR REAL-TIME UPDATES
# ============================================================================

@app.websocket("/ws/simulation-progress/{simulation_id}")
async def websocket_simulation_progress(websocket: WebSocket, simulation_id: str):
    """
    WebSocket endpoint for real-time simulation progress updates
    Clients receive updates as each step completes
    """
    await ws_manager.connect(simulation_id, websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "simulation_id": simulation_id,
            "message": "Connected to simulation feed"
        })
        
        # Keep connection alive and listen for messages
        while True:
            try:
                # Wait for any client messages (ping/pong, etc.)
                data = await websocket.receive_text()
                
                # Echo back or handle commands if needed
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
    
    finally:
        ws_manager.disconnect(simulation_id, websocket)


# ============================================================================
# DEMO & SIMULATION ENDPOINTS
# ============================================================================

@api_router.post("/demo/simulate-prediction")
async def simulate_prediction():
    """
    Create a simulated prediction for demo purposes
    Automatically triggers analytics → report → dispatch flow
    """
    try:
        # Create mock prediction
        prediction_id = f"PRED-DEMO-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        mock_prediction = {
            "id": prediction_id,
            "equipment_id": "eq-demo-001",
            "equipment_code": "SP-DEMO-001",
            "equipment_name": "Demo Solar Pump",
            "predicted_failure": "Bearing Wear",
            "confidence_score": 92.5,
            "predicted_date": (datetime.now()).isoformat(),
            "severity": "high",
            "health_score": 68,
            "time_to_failure_hours": 168,
            "created_at": datetime.now().isoformat()
        }
        
        # Store prediction (make a copy to avoid modifying original)
        prediction_to_store = mock_prediction.copy()
        await db.predictions_demo.insert_one(prediction_to_store)
        
        # Auto-generate analytics
        engine = AnalyticsEngine(mock_prediction)
        analytics_package = engine.generate_analytics_package()
        
        analytics_doc = {
            "id": f"ANALYTICS-{prediction_id}",
            "prediction_id": prediction_id,
            "analytics_package": analytics_package.dict(),
            "generated_at": datetime.now().isoformat(),
            "report_generated": False,
            "dispatched": False
        }
        
        # Make a copy to avoid ObjectId issues
        analytics_to_store = analytics_doc.copy()
        await db.prediction_analytics.insert_one(analytics_to_store)
        
        # Remove _id from response
        analytics_doc.pop('_id', None)
        
        return {
            "success": True,
            "prediction_id": prediction_id,
            "analytics_id": analytics_doc["id"],
            "prediction": mock_prediction,
            "analytics": analytics_package.dict(),
            "message": "Simulation complete! Check the prediction and analytics."
        }
        
    except Exception as e:
        import traceback
        logger.error(f"Simulation error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HISTORICAL INTELLIGENCE ENDPOINTS ⭐ NEW
# ============================================================================

@api_router.get("/historical/status")
async def historical_status():
    """Check status of historical intelligence system"""
    try:
        # Test PostgreSQL connection
        async with db_manager.get_postgres_pool().acquire() as conn:
            table_count = await conn.fetchval("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            
            report_count = await conn.fetchval("SELECT COUNT(*) FROM reports")
            event_count = await conn.fetchval("SELECT COUNT(*) FROM system_events")
        
        return {
            "success": True,
            "status": "operational",
            "database": "PostgreSQL with pgvector",
            "tables": table_count,
            "reports_count": report_count,
            "events_count": event_count,
            "features": [
                "Semantic Search",
                "Historical Context",
                "Event Tracking",
                "Pattern Recognition"
            ]
        }
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {
            "success": False,
            "status": "error",
            "error": str(e)
        }


# DISABLED TEMPORARILY - Will be re-enabled in Phase 3
# @api_router.post("/historical/chatbot/message")
# async def historical_chatbot_message(request: ChatMessageRequest):
#     """
#     Enhanced chatbot with complete historical awareness
#     Can reference past reports, events, and patterns
#     Provides citations to sources
#     """
#     try:
#         response = await historical_chatbot.process_message_with_history(
#             message=request.message,
#             session_id=request.session_id,
#             user_context=request.context
#         )
#         
#         return {
#             "success": True,
#             **response
#         }
#         
#     except Exception as e:
#         logger.error(f"Historical chatbot error: {str(e)}")
#         return {
#             "success": False,
#             "content": "I apologize, but I'm having trouble accessing historical data right now.",
#             "error": str(e)
#         }



@api_router.post("/reports/search")
async def search_reports(request: Dict[str, Any]):
    """
    AI-powered semantic search across all historical reports
    
    Body:
        query: Search query string
        filters: Optional filters (date range, equipment, etc.)
        limit: Max results (default 10)
    """
    try:
        query = request.get('query', '')
        filters = request.get('filters', {})
        limit = request.get('limit', 10)
        
        # Convert filters to context
        context = {}
        if filters.get('equipment_id'):
            context['equipment_id'] = filters['equipment_id']
        if filters.get('date_range'):
            context['date_range'] = filters['date_range']
        
        # Search reports
        reports = await report_storage_service.retrieve_similar_reports(
            query=query,
            context=context,
            limit=limit
        )
        
        return {
            "success": True,
            "query": query,
            "count": len(reports),
            "reports": reports
        }
        
    except Exception as e:
        logger.error(f"Report search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/historical/context/{entity_type}/{entity_id}")
async def get_historical_context(entity_type: str, entity_id: str):
    """
    Get historical context for an entity (equipment, prediction, etc.)
    
    Args:
        entity_type: Type of entity (equipment, prediction, work_order, technician)
        entity_id: ID of the entity
    """
    try:
        # Get report history
        reports = await report_storage_service.get_report_history_for_entity(entity_type, entity_id)
        
        # Get event history (placeholder - will implement when event_orchestrator has this method)
        events = []
        
        return {
            "success": True,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "reports": reports[:10],
            "events": events[:20],
            "summary": f"Found {len(reports)} reports for {entity_type} {entity_id}"
        }
        
    except Exception as e:
        logger.error(f"Historical context error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# DISABLED TEMPORARILY - Pattern recognition will be implemented in Phase 5
# @api_router.get("/patterns/analyze")
# @api_router.get("/patterns/equipment/{equipment_id}")
# @api_router.get("/historical/events")
# @api_router.post("/reports/{report_id}/archive")
# @api_router.get("/predictive/next-failure/{equipment_id}")
# @api_router.get("/predictive/maintenance-schedule")
# @api_router.get("/predictive/cost-forecast")
# @api_router.get("/predictive/risk-periods")
# @api_router.get("/reports/{report_id}/export")
# @api_router.post("/reports/comparative")
# @api_router.get("/reports/trend-analysis")
# @api_router.get("/reports/executive-summary")
# @api_router.post("/reports/schedule")
# @api_router.get("/reports/schedules")


# ============================================================================
# PHASE 3: HISTORICAL AI CHATBOT ⭐ NEW
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    session_id: str
    context: Optional[Dict[str, Any]] = None


@api_router.post("/chatbot/historical")
async def historical_chatbot_endpoint(request: ChatRequest):
    """AI Chatbot with full historical awareness and citations"""
    try:
        response = await historical_chatbot_service.process_message_with_history(
            message=request.message,
            session_id=request.session_id,
            user_context=request.context
        )
        
        return {
            "success": True,
            **response
        }
        
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return {
            "success": False,
            "content": "I apologize, but I'm having trouble processing your request.",
            "error": str(e)
        }


# ============================================================================
# PHASE 4: INTELLIGENT REPORT GENERATION ⭐ NEW
# ============================================================================

class ReportGenerationRequest(BaseModel):
    report_type: str
    current_data: Dict[str, Any]
    parameters: Optional[Dict[str, Any]] = None


@api_router.post("/reports/generate-intelligent")
async def generate_intelligent_report(request: ReportGenerationRequest):
    """Generate report with full historical intelligence and comparison"""
    try:
        report_id = await intelligent_report_generator.generate_historical_report(
            report_type=request.report_type,
            current_data=request.current_data,
            parameters=request.parameters
        )
        
        # Get the generated report
        report = await report_storage_service.get_report_by_id(report_id)
        
        return {
            "success": True,
            "report_id": report_id,
            "report": report
        }
        
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PHASE 5: PATTERN RECOGNITION ⭐ NEW
# ============================================================================

@api_router.get("/patterns/analyze")
async def analyze_patterns(time_period: str = '365d'):
    """Analyze patterns across all historical data"""
    try:
        patterns = await pattern_recognizer_service.analyze_system_patterns(time_period)
        
        return {
            "success": True,
            **patterns
        }
        
    except Exception as e:
        logger.error(f"Pattern analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/patterns/equipment/{equipment_id}")
async def get_equipment_patterns(equipment_id: str):
    """Get historical patterns for specific equipment"""
    try:
        patterns = await pattern_recognizer_service.get_patterns_for_equipment(equipment_id)
        
        return {
            "success": True,
            **patterns
        }
        
    except Exception as e:
        logger.error(f"Equipment patterns error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/patterns/insights")
async def get_pattern_insights():
    """Get AI-generated insights from patterns"""
    try:
        # Analyze recent patterns
        patterns = await pattern_recognizer_service.analyze_system_patterns('90d')
        
        return {
            "success": True,
            "insights": patterns.get('insights', []),
            "patterns": patterns
        }
        
    except Exception as e:
        logger.error(f"Pattern insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# STARTUP & SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize all database connections and services"""
    global report_storage_service, event_orchestrator_service, historical_chatbot_service, pattern_recognizer_service, intelligent_report_generator
    
    try:
        logger.info("🚀 Starting application initialization...")
        
        # Initialize both databases
        await db_manager.initialize()
        
        # Get database instances
        postgres_pool = db_manager.get_postgres_pool()
        mongo_db = db_manager.get_mongodb()
        
        # Initialize services with both databases
        report_storage_service = ReportStorageService(postgres_pool, embedding_service)
        event_orchestrator_service = EventOrchestratorService(
            postgres_pool, embedding_service, report_storage_service
        )
        historical_chatbot_service = HistoricalAwareChatbot(
            postgres_pool, embedding_service, report_storage_service, EMERGENT_LLM_KEY
        )
        historical_chatbot_service.set_mongo_db(mongo_db)
        pattern_recognizer_service = PatternRecognizerService(postgres_pool, mongo_db)
        intelligent_report_generator = IntelligentReportGenerator(
            postgres_pool, report_storage_service, pattern_recognizer_service, EMERGENT_LLM_KEY
        )
        
        logger.info("✅ All services initialized successfully!")
        logger.info("📊 MongoDB: Connected")
        logger.info("🐘 PostgreSQL: Connected with pgvector")
        logger.info("🧠 Embedding Service: Ready")
        logger.info("📝 Report Storage: Ready")
        logger.info("🎯 Event Orchestrator: Ready")
        logger.info("💬 Historical Chatbot: Ready")
        logger.info("📊 Pattern Recognizer: Ready")
        logger.info("📄 Intelligent Report Generator: Ready")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close all database connections"""
    logger.info("Shutting down...")
    client.close()
    await db_manager.close()
    logger.info("✅ All connections closed")
