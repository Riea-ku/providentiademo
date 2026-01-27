# 🏗️ VIDA AI PREDICTIVE ANALYTICS PLATFORM - SYSTEM ARCHITECTURE

## 📋 **TABLE OF CONTENTS**

1. [High-Level Architecture Overview](#high-level-architecture)
2. [Component Breakdown](#component-breakdown)
3. [Data Flow Architecture](#data-flow)
4. [Technology Stack](#technology-stack)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Database Schema](#database-schema)
8. [API Architecture](#api-architecture)
9. [Real-Time Communication](#real-time-communication)
10. [Integration Points](#integration-points)
11. [Deployment Architecture](#deployment-architecture)

---

## 🎯 **HIGH-LEVEL ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VIDA AI PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐         ┌──────────────────┐                       │
│  │   WEB BROWSER   │◄───────►│   REACT SPA      │                       │
│  │  (User Device)  │         │   (Vite + TS)    │                       │
│  └─────────────────┘         └────────┬─────────┘                       │
│                                       │                                  │
│                                       │ HTTPS/WSS                        │
│                                       ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    KUBERNETES CLUSTER                            │   │
│  │  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    │   │
│  │  │   NGINX     │───►│   FRONTEND   │    │    BACKEND      │    │   │
│  │  │  (Ingress)  │    │   (Port 3000)│    │  (Port 8001)    │    │   │
│  │  └─────────────┘    └──────────────┘    └────────┬────────┘    │   │
│  │                                                   │              │   │
│  │                                                   ▼              │   │
│  │                         ┌─────────────────────────────────┐     │   │
│  │                         │      MONGODB DATABASE           │     │   │
│  │                         │     (Port 27017)                │     │   │
│  │                         └─────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              EXTERNAL INTEGRATIONS                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Claude     │  │   Supabase   │  │   Emergent   │          │   │
│  │  │  Sonnet 4.5  │  │   (Optional) │  │   LLM Key    │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 **COMPONENT BREAKDOWN**

### **1. FRONTEND LAYER (React + TypeScript)**

```
frontend/
├── src/
│   ├── pages/                          # Route-level components
│   │   ├── Index.tsx                   # Dashboard home
│   │   ├── Predictions.tsx             # Failure predictions list
│   │   ├── Equipment.tsx               # Equipment management
│   │   ├── Farms.tsx                   # Farm locations
│   │   ├── WorkOrders.tsx              # Maintenance work orders
│   │   ├── Inventory.tsx               # Parts inventory
│   │   ├── Analytics.tsx               # Analytics dashboard
│   │   ├── EnhancedAnalytics.tsx       # Advanced analytics (demo)
│   │   ├── AIAnalyticsSimulation.tsx   # ⭐ NEW: Interactive simulation
│   │   └── Reports.tsx                 # Reports listing
│   │
│   ├── components/
│   │   ├── Sidebar.tsx                 # Main navigation
│   │   ├── dashboard/                  # Dashboard components
│   │   │   ├── Header.tsx
│   │   │   ├── QuickStats.tsx
│   │   │   ├── SystemStatus.tsx
│   │   │   └── EnterpriseDashboard.tsx
│   │   ├── charts/                     # Data visualizations
│   │   │   ├── EquipmentHealthChart.tsx
│   │   │   └── PredictionTrend.tsx
│   │   ├── chat/                       # AI chatbot interface
│   │   │   └── AgriChatbot.tsx
│   │   └── ui/                         # Reusable UI components (shadcn)
│   │       ├── card.tsx
│   │       ├── button.tsx
│   │       ├── badge.tsx
│   │       └── [50+ UI components]
│   │
│   ├── lib/                            # Utilities
│   │   └── utils.ts
│   │
│   ├── integrations/                   # External integrations
│   │   └── supabase/
│   │       ├── client.ts               # Supabase client
│   │       └── types.ts                # Database types
│   │
│   ├── App.tsx                         # Root component with routes
│   └── main.tsx                        # Entry point
│
├── public/                             # Static assets
├── .env                                # Environment variables
│   └── VITE_BACKEND_URL               # Backend API URL
│   └── VITE_SUPABASE_URL              # Supabase URL (optional)
│   └── VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase key (optional)
└── package.json                        # Dependencies
```

**Key Features:**
- Single Page Application (SPA) with React Router
- TypeScript for type safety
- Vite for fast development and builds
- Tailwind CSS + shadcn/ui for styling
- WebSocket support for real-time updates
- Responsive design (mobile, tablet, desktop)

---

### **2. BACKEND LAYER (FastAPI + Python)**

```
backend/
├── server.py                           # ⭐ Main API server (FastAPI)
│   ├── Health check endpoints
│   ├── Prediction analytics endpoints
│   ├── Analytics generation endpoints
│   ├── Report generation endpoints
│   ├── Dispatch endpoints
│   ├── Chatbot endpoints
│   ├── Demo/simulation endpoints
│   └── WebSocket endpoints
│
├── analytics_engine.py                 # ⭐ Analytics processing
│   ├── AnalyticsPackage                # Pydantic models
│   ├── AnalyticsEngine                 # Core analytics logic
│   │   ├── calculate_impact()
│   │   ├── analyze_historical_context()
│   │   ├── generate_recommendations()
│   │   ├── calculate_resources()
│   │   └── generate_analytics_package()
│   └── AnalyticsChatbot                # AI-powered explanations
│       ├── explain_prediction()
│       └── answer_analytics_query()
│
├── report_generator.py                 # ⭐ Automated report generation
│   ├── TechnicianDispatchReport        # Report creation
│   │   ├── generate()
│   │   └── format_sections()
│   └── ReportDispatcher                # Technician assignment
│       ├── auto_assign_technician()
│       └── create_work_order_from_report()
│
├── simulation_engine.py                # ⭐ NEW: Simulation system
│   ├── SimulationEngine                # 6-step simulation workflow
│   │   ├── run_simulation()
│   │   ├── step_1_generate_prediction()
│   │   ├── step_2_run_analytics()
│   │   ├── step_3_generate_report()
│   │   ├── step_4_check_inventory()
│   │   ├── step_5_dispatch_technician()
│   │   └── step_6_send_notifications()
│   ├── WebSocketManager              # Real-time updates
│   │   ├── connect()
│   │   ├── disconnect()
│   │   └── broadcast()
│   └── FAILURE_MODE_TEMPLATES        # Predefined scenarios
│       ├── bearing_wear
│       ├── motor_overheat
│       └── pump_cavitation
│
├── requirements.txt                    # Python dependencies
│   ├── fastapi==0.110.1
│   ├── uvicorn==0.25.0
│   ├── motor==3.3.1                   # MongoDB async driver
│   ├── pydantic>=2.6.4
│   ├── emergentintegrations==0.1.0    # LLM integration
│   └── [other dependencies]
│
└── .env (via supervisor)               # Environment variables
    ├── MONGO_URL                       # MongoDB connection
    ├── DB_NAME                         # Database name
    └── EMERGENT_LLM_KEY               # AI model access
```

**Key Features:**
- FastAPI for high-performance async API
- Pydantic for data validation
- Motor for async MongoDB operations
- Claude Sonnet 4.5 integration for AI insights
- WebSocket support for real-time updates
- Modular service architecture

---

### **3. DATABASE LAYER (MongoDB)**

```
MongoDB (vida_ai_db)
├── Collections:
│
├── status_checks                       # System health monitoring
│   └── { id, client_name, timestamp }
│
├── predictions_demo                    # Demo predictions
│   └── { id, equipment_id, predicted_failure, confidence_score, ... }
│
├── prediction_analytics                # Generated analytics
│   └── { id, prediction_id, analytics_package, generated_at, ... }
│
├── automated_reports                   # Generated reports
│   └── { id, analytics_id, report_type, content, status, ... }
│
├── work_orders                         # Maintenance work orders
│   └── { id, prediction_id, assigned_technician_id, priority, ... }
│
├── dispatch_history                    # Technician dispatch logs
│   └── { id, report_id, technician_id, work_order_id, ... }
│
└── ai_simulations                      # ⭐ NEW: Simulation runs
    ├── { id, failure_mode, equipment_id, status, current_step }
    ├── steps: [6 simulation steps]
    ├── prediction_data: {...}
    ├── analytics_data: {...}
    ├── report_data: {...}
    ├── inventory_data: {...}
    ├── dispatch_data: {...}
    └── notifications_data: {...}
```

**Data Flow:**
1. Prediction → Analytics → Report → Work Order → Dispatch
2. All steps stored in MongoDB for history and retrieval
3. Real-time updates broadcast via WebSocket
4. AI can query any historical data

---

## 🔄 **DATA FLOW ARCHITECTURE**

### **Complete Prediction → Action Flow**

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PREDICTION CREATION                                │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│   STEP 1: AI GENERATES FAILURE PREDICTION                            │
│   - Equipment data analysis                                          │
│   - Sensor data processing                                           │
│   - Failure type prediction                                          │
│   - Confidence score calculation                                     │
│   Output: prediction_data → MongoDB                                  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│   STEP 2: ANALYTICS & IMPACT ASSESSMENT                              │
│   - AnalyticsEngine processes prediction                             │
│   - Financial impact calculation                                     │
│   - Downtime estimation                                              │
│   - Resource requirements                                            │
│   - Confidence metrics                                               │
│   Output: analytics_data → MongoDB                                   │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│   STEP 3: AUTOMATED REPORT GENERATION                                │
│   - TechnicianDispatchReport creates report                          │
│   - Executive summary                                                │
│   - Safety instructions                                              │
│   - Parts requirements                                               │
│   - Technical procedures                                             │
│   Output: report_data → MongoDB                                      │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│   STEP 4: INVENTORY CHECK & RESERVATION                              │
│   - Query inventory for required parts                               │
│   - Check availability                                               │
│   - Reserve available parts                                          │
│   - Identify parts to order                                          │
│   Output: inventory_data → MongoDB                                   │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│   STEP 5: TECHNICIAN AUTO-DISPATCH                                   │
│   - ReportDispatcher.auto_assign_technician()                        │
│   - Skills matching algorithm                                        │
│   - Workload balancing                                               │
│   - Create work order                                                │
│   - Assign to technician                                             │
│   Output: dispatch_data, work_order → MongoDB                        │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│   STEP 6: NOTIFICATIONS SENT                                         │
│   - Notify technician (email, SMS, app)                              │
│   - Notify manager                                                   │
│   - Notify operations team                                           │
│   - Update dispatch history                                          │
│   Output: notifications_data → MongoDB                               │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
                    ✅ COMPLETE!
```

### **Real-Time Communication Flow**

```
┌─────────────┐                    ┌─────────────┐
│   BROWSER   │                    │   BACKEND   │
│  (Frontend) │                    │   (FastAPI) │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  1. Click "Bearing Wear"        │
       ├─────────────────────────────────►│
       │  POST /api/ai-analytics/        │
       │       simulate-failure          │
       │                                  │
       │◄─────────────────────────────────┤
       │  2. Returns simulation_id       │
       │                                  │
       │  3. Connect WebSocket           │
       ├─────────────────────────────────►│
       │  WS /ws/simulation-progress/    │
       │     {simulation_id}             │
       │                                  │
       │                                  ├──► 4. Start Simulation
       │                                  │    (6 steps in background)
       │                                  │
       │◄─────────────────────────────────┤
       │  5. Step 1 Complete             │
       │     (WebSocket message)         │
       │                                  │
       │◄─────────────────────────────────┤
       │  6. Step 2 Complete             │
       │                                  │
       │◄─────────────────────────────────┤
       │  7. Step 3 Complete             │
       │                                  │
       │         ... etc ...              │
       │                                  │
       │◄─────────────────────────────────┤
       │  12. Simulation Complete        │
       │      (All 6 steps done)         │
       │                                  │
       │  13. Display Results            │
       │      with all data              │
       │                                  │
```

---

## 🛠️ **TECHNOLOGY STACK**

### **Frontend**
```
┌─────────────────────────────────────────┐
│  Framework: React 18.2+                 │
│  Language: TypeScript 5.2+              │
│  Build Tool: Vite 5.4+                  │
│  Routing: React Router v6               │
│  Styling: Tailwind CSS 3.4+             │
│  UI Components: shadcn/ui               │
│  State Management: React Hooks          │
│  HTTP Client: Fetch API                 │
│  WebSocket: Native WebSocket API        │
│  Icons: Lucide React                    │
│  Charts: (Ready for Recharts/Chart.js)  │
└─────────────────────────────────────────┘
```

### **Backend**
```
┌─────────────────────────────────────────┐
│  Framework: FastAPI 0.110+              │
│  Language: Python 3.11                  │
│  ASGI Server: Uvicorn 0.25+             │
│  Database Driver: Motor 3.3+            │
│  Validation: Pydantic 2.6+              │
│  AI Integration: emergentintegrations   │
│  LLM: Claude Sonnet 4.5                 │
│  WebSocket: FastAPI WebSocket           │
│  CORS: Starlette CORS Middleware        │
└─────────────────────────────────────────┘
```

### **Database**
```
┌─────────────────────────────────────────┐
│  Database: MongoDB 6.0+                 │
│  Driver: Motor (async)                  │
│  Connection: mongodb://localhost:27017  │
│  Database: vida_ai_db                   │
└─────────────────────────────────────────┘
```

### **Infrastructure**
```
┌─────────────────────────────────────────┐
│  Container: Kubernetes                  │
│  Process Manager: Supervisor            │
│  Web Server: Nginx (Ingress)            │
│  Frontend Port: 3000                    │
│  Backend Port: 8001                     │
│  Database Port: 27017                   │
└─────────────────────────────────────────┘
```

---

## 🔌 **API ARCHITECTURE**

### **Complete API Endpoints**

```
BASE URL: https://[your-domain]/api

┌─────────────────────────────────────────────────────────────────┐
│  HEALTH & STATUS                                                │
├─────────────────────────────────────────────────────────────────┤
│  GET    /                          # API info                   │
│  GET    /health                    # Health check              │
│  POST   /status                    # Create status check       │
│  GET    /status                    # Get status checks         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PREDICTIVE ANALYTICS                                           │
├─────────────────────────────────────────────────────────────────┤
│  POST   /predictions/{id}/generate-analytics                    │
│         # Generate analytics from prediction                    │
│                                                                 │
│  GET    /analytics/{analytics_id}                               │
│         # Get analytics by ID                                   │
│                                                                 │
│  POST   /analytics/{analytics_id}/explain                       │
│         # Get AI explanation of analytics                       │
│                                                                 │
│  POST   /analytics/{analytics_id}/generate-report               │
│         # Generate automated report                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  REPORTS & DISPATCH                                             │
├─────────────────────────────────────────────────────────────────┤
│  GET    /reports/{report_id}       # Get report by ID          │
│  GET    /reports                   # List all reports          │
│  POST   /reports/{id}/dispatch     # Dispatch technician       │
│  GET    /dispatch-history          # Get dispatch history      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AI CHATBOT                                                     │
├─────────────────────────────────────────────────────────────────┤
│  POST   /chatbot/message           # Send message to chatbot   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DEMO & SIMULATION                                              │
├─────────────────────────────────────────────────────────────────┤
│  POST   /demo/simulate-prediction  # Run demo simulation       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ⭐ AI ANALYTICS SIMULATION (NEW)                                │
├─────────────────────────────────────────────────────────────────┤
│  POST   /ai-analytics/simulate-failure                          │
│         # Start interactive simulation                          │
│         Body: {                                                 │
│           failure_mode: "bearing_wear" | "motor_overheat" |    │
│                        "pump_cavitation",                       │
│           equipment_id: "pump-001",                            │
│           run_full_cycle: true                                 │
│         }                                                       │
│         Returns: {                                              │
│           simulation_id, status, websocket_url                 │
│         }                                                       │
│                                                                 │
│  GET    /ai-analytics/simulation/{simulation_id}                │
│         # Get simulation status and results                     │
│                                                                 │
│  GET    /ai-analytics/simulations                               │
│         # List recent simulations                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ⭐ WEBSOCKET (Real-time Updates)                                │
├─────────────────────────────────────────────────────────────────┤
│  WS     /ws/simulation-progress/{simulation_id}                 │
│         # Real-time simulation progress updates                 │
│         Messages:                                               │
│         - { type: "connected", simulation_id, message }        │
│         - { type: "step_update", step, message, current_step } │
│         - { type: "simulation_complete", simulation }          │
└─────────────────────────────────────────────────────────────────┘
```

### **API Request/Response Examples**

#### **1. Start Simulation**
```bash
POST /api/ai-analytics/simulate-failure
Content-Type: application/json

{
  "failure_mode": "bearing_wear",
  "equipment_id": "pump-001",
  "run_full_cycle": true
}

# Response:
{
  "success": true,
  "simulation_id": "c4f1a141-4466-49e4-a666-5b31ad8e6d07",
  "status": "complete",
  "message": "Simulation started - connect to WebSocket for live updates",
  "websocket_url": "/ws/simulation-progress/c4f1a141-4466-49e4-a666-5b31ad8e6d07"
}
```

#### **2. Get Simulation Results**
```bash
GET /api/ai-analytics/simulation/c4f1a141-4466-49e4-a666-5b31ad8e6d07

# Response:
{
  "success": true,
  "simulation": {
    "id": "c4f1a141-4466-49e4-a666-5b31ad8e6d07",
    "failure_mode": "bearing_wear",
    "status": "complete",
    "current_step": 6,
    "steps": [ /* 6 steps with details */ ],
    "prediction_data": { /* full prediction */ },
    "analytics_data": { /* full analytics */ },
    "report_data": { /* generated report */ },
    "inventory_data": { /* inventory status */ },
    "dispatch_data": { /* technician assignment */ },
    "notifications_data": { /* notifications sent */ }
  }
}
```

#### **3. WebSocket Connection**
```javascript
const ws = new WebSocket('wss://[domain]/ws/simulation-progress/[id]');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'step_update') {
    console.log(`Step ${data.step.step_number}: ${data.step.status}`);
    console.log(`Details: ${data.step.details}`);
  }
  
  if (data.type === 'simulation_complete') {
    console.log('Simulation finished!', data.simulation);
  }
};
```

---

## 🌐 **FRONTEND ARCHITECTURE**

### **Component Hierarchy**

```
App.tsx (Root)
├── BrowserRouter
│   ├── Routes
│   │   ├── "/" → Index (Dashboard)
│   │   ├── "/predictions" → Predictions
│   │   ├── "/equipment" → Equipment
│   │   ├── "/analytics-enhanced" → EnhancedAnalytics
│   │   ├── "/ai-analytics-simulation" → AIAnalyticsSimulation ⭐
│   │   └── [other routes]
│   │
│   └── Layout
│       ├── Sidebar (Navigation)
│       │   ├── Dashboard
│       │   ├── Predictions
│       │   ├── AI Analytics
│       │   ├── AI Simulation ⭐
│       │   ├── Equipment
│       │   └── [other links]
│       │
│       └── Content Area
│           ├── Header (Search, notifications, user)
│           └── Page Content
```

### **State Management Pattern**

```typescript
// Each page manages its own state
const AIAnalyticsSimulation = () => {
  // Local state
  const [selectedFailureMode, setSelectedFailureMode] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  
  // API calls
  const startSimulation = async (failureMode: string) => {
    const response = await fetch(`${backend_url}/api/ai-analytics/simulate-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failure_mode: failureMode, ... })
    });
    // Handle response and connect WebSocket
  };
  
  // Real-time updates via WebSocket
  useEffect(() => {
    if (simulationId) {
      connectWebSocket(simulationId);
    }
  }, [simulationId]);
  
  return (
    <div>
      {/* UI renders based on state */}
    </div>
  );
};
```

### **Styling Architecture**

```
Tailwind CSS (Utility-first)
├── tailwind.config.ts              # Configuration
│   ├── Theme colors (primary, secondary, etc.)
│   ├── Custom animations
│   └── Plugin configurations
│
├── index.css                       # Global styles
│   ├── @tailwind base
│   ├── @tailwind components
│   └── @tailwind utilities
│
└── Component-level styling
    └── className="flex items-center gap-2 p-4 rounded-lg"
```

---

## 🔧 **BACKEND ARCHITECTURE**

### **Service Layer Pattern**

```python
# Separation of concerns

# 1. API Layer (server.py)
@api_router.post("/ai-analytics/simulate-failure")
async def simulate_failure_cycle(request: SimulationRequest):
    # Handle HTTP request
    # Delegate to service layer
    simulation = await simulation_engine.run_simulation(request)
    return {"success": True, "simulation_id": simulation.id}

# 2. Service Layer (simulation_engine.py)
class SimulationEngine:
    async def run_simulation(self, request: SimulationRequest):
        # Business logic
        # Orchestrate 6 steps
        # Return structured data
        pass

# 3. Data Layer (MongoDB via Motor)
await db.ai_simulations.insert_one(simulation.dict())
```

### **Error Handling Pattern**

```python
try:
    # Main logic
    simulation = await simulation_engine.run_simulation(request)
    return {"success": True, ...}
    
except HTTPException:
    # Re-raise HTTP exceptions
    raise
    
except Exception as e:
    # Log detailed error
    logger.error(f"Simulation error: {str(e)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    # Return error to client
    raise HTTPException(status_code=500, detail=str(e))
```

### **Async Patterns**

```python
# All I/O operations are async
async def run_simulation(self, request: SimulationRequest):
    # Async database operations
    await self.db.ai_simulations.insert_one(...)
    
    # Async HTTP calls
    analytics = await analytics_engine.generate_analytics(...)
    
    # Async delays (non-blocking)
    await asyncio.sleep(1.5)
    
    # Async WebSocket broadcasting
    await self.ws_manager.broadcast(...)
```

---

## 🔄 **REAL-TIME COMMUNICATION**

### **WebSocket Flow**

```
Client (Browser)                      Server (FastAPI)
     │                                      │
     │  1. POST /simulate-failure          │
     ├────────────────────────────────────►│
     │                                      │
     │◄─────────────────────────────────────┤
     │  2. {simulation_id, websocket_url}  │
     │                                      │
     │  3. WS Connect                       │
     ├────────────────────────────────────►│
     │  /ws/simulation-progress/{id}       │
     │                                      │
     │◄─────────────────────────────────────┤
     │  4. {type: "connected"}             │
     │                                      │
     │                                      ├──► Start background task
     │                                      │    (6 steps execute)
     │                                      │
     │◄─────────────────────────────────────┤
     │  5. {type: "step_update",           │
     │      step: 1, status: "complete"}   │
     │                                      │
     │  [Update UI - Step 1 ✅]            │
     │                                      │
     │◄─────────────────────────────────────┤
     │  6. {type: "step_update",           │
     │      step: 2, status: "complete"}   │
     │                                      │
     │  [Update UI - Step 2 ✅]            │
     │                                      │
     │         ... steps 3-6 ...            │
     │                                      │
     │◄─────────────────────────────────────┤
     │  12. {type: "simulation_complete",  │
     │       simulation: {...}}            │
     │                                      │
     │  [Display final results]            │
     │                                      │
     │  13. WS Close                        │
     ├────────────────────────────────────►│
     │                                      │
```

### **WebSocket Manager Implementation**

```python
class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List] = {}
    
    async def connect(self, simulation_id: str, websocket):
        await websocket.accept()
        if simulation_id not in self.active_connections:
            self.active_connections[simulation_id] = []
        self.active_connections[simulation_id].append(websocket)
    
    async def broadcast(self, simulation_id: str, message: dict):
        if simulation_id in self.active_connections:
            for connection in self.active_connections[simulation_id]:
                await connection.send_json(message)
```

---

## 🗄️ **DATABASE SCHEMA**

### **MongoDB Collections**

```javascript
// ai_simulations collection
{
  _id: ObjectId("..."),                // MongoDB internal ID
  id: "uuid-string",                   // Application-level UUID
  failure_mode: "bearing_wear",
  equipment_id: "pump-001",
  started_at: "2026-01-23T19:50:00Z",
  completed_at: "2026-01-23T19:50:09Z",
  status: "complete",
  current_step: 6,
  
  steps: [
    {
      step_number: 1,
      step_name: "AI Generates Failure Prediction",
      status: "complete",
      started_at: "2026-01-23T19:50:01Z",
      completed_at: "2026-01-23T19:50:02Z",
      details: "Predicted: Bearing Wear with 92.5% confidence",
      result: { prediction_id: "PRED-..." }
    },
    // ... 5 more steps
  ],
  
  prediction_data: {
    id: "PRED-SIM-20260123195000",
    equipment_name: "Solar Pump pump-001",
    predicted_failure: "Bearing Wear",
    confidence_score: 92.5,
    health_score: 65,
    time_to_failure_hours: 72,
    sensor_data: { ... }
  },
  
  analytics_data: {
    id: "ANALYTICS-PRED-...",
    analytics_package: {
      impact_analysis: {
        cost: 3500,
        downtime_hours: 14.4,
        total_financial_impact: 12810
      },
      recommendations: [...],
      resource_requirements: {...}
    }
  },
  
  report_data: {
    report_id: "DISPATCH-...",
    executive_summary: "...",
    parts_requirements: [...],
    safety_instructions: [...]
  },
  
  inventory_data: {
    total_parts_needed: 3,
    available_parts: 2,
    parts_to_order: [...]
  },
  
  dispatch_data: {
    technician: {
      id: "tech-001",
      first_name: "John",
      last_name: "Smith",
      experience_years: 8
    },
    work_order: {...},
    skill_match: 95
  },
  
  notifications_data: {
    total_notifications_sent: 5,
    notification_channels: ["email", "sms", "app_push"]
  }
}
```

### **Data Relationships**

```
Prediction
    ↓ (generates)
Analytics
    ↓ (produces)
Report
    ↓ (creates)
Work Order
    ↓ (assigns)
Technician Dispatch
    ↓ (logs)
Dispatch History

All connected through IDs and stored in MongoDB
```

---

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **Kubernetes Setup**

```yaml
# Current deployment structure

Kubernetes Cluster
├── Services:
│   ├── frontend (Port 3000)
│   │   └── Vite dev server with hot reload
│   │
│   ├── backend (Port 8001)
│   │   └── Uvicorn FastAPI server
│   │
│   └── mongodb (Port 27017)
│       └── MongoDB database server
│
├── Ingress (Nginx):
│   ├── / → frontend:3000
│   ├── /api/* → backend:8001
│   └── /ws/* → backend:8001
│
└── Supervisor (Process Manager):
    ├── frontend → yarn start
    ├── backend → uvicorn server:app --reload
    └── mongodb → mongod
```

### **Environment Configuration**

```bash
# Backend environment (via Supervisor)
MONGO_URL=mongodb://localhost:27017
DB_NAME=vida_ai_db
EMERGENT_LLM_KEY=sk-emergent-...
APP_URL=https://[domain].preview.emergentagent.com
INTEGRATION_PROXY_URL=https://integrations.emergentagent.com

# Frontend environment (.env)
VITE_BACKEND_URL=https://[domain].preview.emergentagent.com
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=placeholder_key
```

### **Service Communication**

```
External User
     │
     ▼
┌─────────────────┐
│  Nginx Ingress  │  (Port 443 HTTPS)
└────────┬────────┘
         │
         ├──► /           → Frontend (Port 3000)
         ├──► /api/*     → Backend (Port 8001)
         └──► /ws/*      → Backend WebSocket (Port 8001)
```

---

## 🔗 **INTEGRATION POINTS**

### **External Services**

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Sonnet 4.5 (via Emergent LLM Key)                   │
│  ────────────────────────────────────────────────────────── │
│  • AI-powered analytics explanations                         │
│  • Natural language report generation                        │
│  • Chatbot responses                                         │
│  • Recommendation generation                                 │
│                                                              │
│  Integration: emergentintegrations library                   │
│  Authentication: EMERGENT_LLM_KEY                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Supabase (Optional - for historical data)                  │
│  ────────────────────────────────────────────────────────── │
│  • Equipment data                                            │
│  • Work orders                                               │
│  • User profiles                                             │
│  • Historical predictions                                    │
│                                                              │
│  Integration: @supabase/supabase-js                         │
│  Status: Configured but not required                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MongoDB (Primary Database)                                 │
│  ────────────────────────────────────────────────────────── │
│  • Simulation data                                           │
│  • Analytics results                                         │
│  • Reports                                                   │
│  • Work orders & dispatch history                           │
│                                                              │
│  Integration: Motor (async driver)                          │
│  Connection: mongodb://localhost:27017                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **SYSTEM CAPABILITIES**

### **What the System Can Do:**

1. **AI-Powered Failure Prediction**
   - Analyze equipment sensor data
   - Predict failure types and timing
   - Calculate confidence scores
   - Generate health scores

2. **Automated Analytics Generation**
   - Financial impact analysis
   - Downtime estimation
   - Resource requirement calculation
   - Historical context analysis
   - AI-powered recommendations

3. **Intelligent Report Generation**
   - Executive summaries
   - Technical procedures
   - Safety instructions
   - Parts requirements
   - Timeline scheduling

4. **Smart Technician Dispatch**
   - Skills-based assignment
   - Workload balancing
   - Experience matching
   - Work order creation
   - Automated notifications

5. **Interactive Simulation System** ⭐
   - 3 failure mode scenarios
   - Real-time 6-step workflow
   - WebSocket progress updates
   - Complete results visualization
   - Historical data storage

6. **AI Chatbot Assistant**
   - Natural language queries
   - Context-aware responses
   - Analytics explanations
   - Report summaries
   - Recommendation clarifications

---

## 🎯 **KEY ARCHITECTURAL DECISIONS**

### **Why These Technologies?**

1. **React + TypeScript**
   - Type safety reduces bugs
   - Component reusability
   - Large ecosystem
   - Fast development

2. **FastAPI + Python**
   - High performance (async)
   - Easy integration with AI libraries
   - Automatic API documentation
   - Type hints with Pydantic

3. **MongoDB**
   - Flexible schema (perfect for analytics data)
   - Native JSON support
   - Async driver support
   - Easy to scale

4. **WebSocket**
   - Real-time updates without polling
   - Efficient bi-directional communication
   - Low latency
   - Better UX

5. **Kubernetes + Supervisor**
   - Easy service management
   - Auto-restart on failure
   - Environment isolation
   - Scalable architecture

---

## 📈 **SCALABILITY CONSIDERATIONS**

### **Current Architecture Supports:**

- ✅ Multiple concurrent simulations
- ✅ Real-time updates to many clients
- ✅ Async operations (non-blocking)
- ✅ Modular service architecture
- ✅ Horizontal scaling ready (stateless backend)
- ✅ Database indexing for performance
- ✅ WebSocket connection pooling

### **Future Enhancements:**

- 🔄 Redis for caching and session management
- 🔄 Message queue (RabbitMQ/Kafka) for event processing
- 🔄 Load balancer for multiple backend instances
- 🔄 CDN for static assets
- 🔄 Database replication for high availability
- 🔄 Microservices architecture (if needed)

---

## 🔒 **SECURITY ARCHITECTURE**

```
Security Layers:

1. HTTPS/WSS (TLS encryption)
   └─► All traffic encrypted

2. CORS Middleware
   └─► Only allowed origins can access API

3. Environment Variables
   └─► Sensitive data not in code

4. API Key Authentication (EMERGENT_LLM_KEY)
   └─► Secure LLM access

5. Input Validation (Pydantic)
   └─► All requests validated

6. Error Handling
   └─► No sensitive data in error messages
```

---

## 🎨 **UI/UX ARCHITECTURE**

### **Design System**

```
Vida AI Design Language
├── Colors:
│   ├── Primary: Purple (#8B5CF6)
│   ├── Secondary: Blue
│   ├── Success: Green
│   ├── Warning: Yellow/Orange
│   └── Error: Red
│
├── Typography:
│   ├── Headings: Font weight 700
│   ├── Body: Font weight 400
│   └── Code: Monospace
│
├── Spacing:
│   └── Tailwind scale (4px increments)
│
├── Components:
│   ├── Cards with shadows
│   ├── Rounded corners (lg)
│   ├── Gradients on key areas
│   └── Smooth transitions
│
└── Dark Theme:
    └── Primary interface color
```

### **Responsive Breakpoints**

```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px

Sidebar:
- Mobile: Collapsed (icons only)
- Desktop: Expanded (full width)

Layout adapts automatically
```

---

## 📝 **SUMMARY**

The Vida AI Predictive Analytics Platform is a comprehensive, full-stack system that:

1. **Predicts equipment failures** using AI and sensor data
2. **Analyzes impact** with financial and operational metrics
3. **Generates automated reports** with AI assistance
4. **Dispatches technicians** intelligently based on skills
5. **Provides real-time simulation** with 6-step workflow visualization
6. **Offers AI chatbot** for natural language queries
7. **Stores complete history** in MongoDB for analysis
8. **Updates in real-time** via WebSocket connections

**Architecture Highlights:**
- ✅ Modern tech stack (React, FastAPI, MongoDB)
- ✅ Async/await throughout for performance
- ✅ Real-time communication via WebSocket
- ✅ AI-powered with Claude Sonnet 4.5
- ✅ Type-safe with TypeScript and Pydantic
- ✅ Modular and maintainable code structure
- ✅ Production-ready with proper error handling
- ✅ Scalable architecture ready for growth

**All components are interconnected and working together to create a seamless predictive maintenance experience.**

