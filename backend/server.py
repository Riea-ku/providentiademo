from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
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

# Import analytics modules
from analytics_engine import AnalyticsEngine, AnalyticsChatbot
from report_generator import TechnicianDispatchReport, ReportDispatcher
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

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
        
        result = await db.prediction_analytics.insert_one(analytics_doc)
        analytics_doc["_id"] = str(result.inserted_id)
        
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
        analytics = await db.prediction_analytics.find_one({"id": analytics_id})
        if not analytics:
            raise HTTPException(status_code=404, detail="Analytics not found")
        
        # Simulated prediction data
        prediction_id = analytics.get("prediction_id")
        mock_prediction = {
            "id": prediction_id,
            "equipment_id": "eq-123",
            "equipment": {
                "id": "eq-123",
                "name": "Solar Pump A",
                "equipment_code": "SP-001",
                "equipment_type": "solar_pump",
                "location_gps": {"lat": 37.7749, "lng": -122.4194}
            },
            "confidence_score": 92,
            "health_score": 68,
            "time_to_failure_hours": 168,
            "maintenance_urgency": "high",
            "failure_types": [
                {"type": "Bearing Wear", "severity": "critical"}
            ]
        }
        
        # Generate report
        report_generator = TechnicianDispatchReport(
            mock_prediction,
            analytics.get("analytics_package", {})
        )
        report = report_generator.generate()
        
        # Store report
        report_doc = {
            "id": report["report_id"],
            "analytics_id": analytics_id,
            "report_type": report["report_type"],
            "content": report,
            "generated_for": [],
            "dispatched_to": [],
            "status": "generated",
            "created_at": datetime.now().isoformat()
        }
        
        await db.automated_reports.insert_one(report_doc)
        
        # Update analytics
        await db.prediction_analytics.update_one(
            {"id": analytics_id},
            {"$set": {"report_generated": True}}
        )
        
        return {
            "success": True,
            "report_id": report["report_id"],
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
        
        # Store work order
        await db.work_orders.insert_one(work_order_data)
        
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
        
        await db.dispatch_history.insert_one(dispatch_log)
        
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
        logger.error(f"Simulation error: {str(e)}")
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
