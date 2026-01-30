# 🎯 VIDA AI - QUICK ARCHITECTURE REFERENCE

## System Overview in One Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  React SPA (TypeScript + Tailwind)                                     │ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  Pages:                                                                │ │
│  │  • Dashboard          • Predictions      • Analytics                  │ │
│  │  • AI Simulation ⭐   • Equipment        • Reports                     │ │
│  │  • Work Orders        • Inventory        • Farms                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTPS/WSS
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (FastAPI)                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  REST API Endpoints                    WebSocket Endpoints             │ │
│  │  • /api/health                         • /ws/simulation-progress/{id}  │ │
│  │  • /api/analytics/*                                                    │ │
│  │  • /api/reports/*                      Real-time Updates               │ │
│  │  • /api/ai-analytics/simulate-failure                                  │ │
│  │  • /api/chatbot/message                                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC SERVICES                                │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │
│  │ SimulationEngine  │  │ AnalyticsEngine  │  │  ReportGenerator     │    │
│  │ ────────────────  │  │ ───────────────  │  │  ───────────────     │    │
│  │ • 6-step workflow │  │ • Impact calc    │  │ • Auto-generate      │    │
│  │ • Failure modes   │  │ • Recommendations│  │ • Executive summary  │    │
│  │ • Real-time sync  │  │ • Resource calc  │  │ • Tech assignment    │    │
│  └───────────────────┘  └──────────────────┘  └──────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (MongoDB)                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Collections:                                                          │ │
│  │  • ai_simulations          • prediction_analytics                     │ │
│  │  • automated_reports       • work_orders                              │ │
│  │  • dispatch_history        • status_checks                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS                                 │
│  ┌────────────────────┐      ┌────────────────────┐                        │
│  │  Claude Sonnet 4.5 │      │  Emergent LLM Key  │                        │
│  │  ─────────────────  │      │  ─────────────────  │                        │
│  │  • AI explanations  │      │  • Universal auth  │                        │
│  │  • Recommendations  │      │  • Multi-provider  │                        │
│  │  • Chatbot          │      │  • Secure access   │                        │
│  └────────────────────┘      └────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Simulation Example

```
1. User clicks "Bearing Wear" button
   ↓
2. Frontend sends POST /api/ai-analytics/simulate-failure
   ↓
3. Backend creates simulation and returns ID
   ↓
4. Frontend connects to WebSocket (/ws/simulation-progress/{id})
   ↓
5. Backend executes 6 steps:
   • Step 1: Generate prediction (92.5% confidence)
   • Step 2: Run analytics ($12,810 impact, 14.4h downtime)
   • Step 3: Generate report (dispatch ready)
   • Step 4: Check inventory (2/3 parts available)
   • Step 5: Assign technician (John Smith, 8y exp)
   • Step 6: Send notifications (5 sent via 3 channels)
   ↓
6. Each step broadcasts update via WebSocket
   ↓
7. Frontend updates UI in real-time
   ↓
8. Display complete results with all data
```

## Tech Stack Summary

| Layer      | Technology                | Purpose                    |
|------------|---------------------------|----------------------------|
| Frontend   | React 18 + TypeScript     | User interface             |
| Styling    | Tailwind CSS + shadcn/ui  | Design system              |
| Build      | Vite 5.4                  | Fast development           |
| Backend    | FastAPI 0.110 + Python    | REST API & WebSocket       |
| Database   | MongoDB 6.0 + Motor       | Data persistence           |
| AI         | Claude Sonnet 4.5         | Intelligence layer         |
| Real-time  | WebSocket (native)        | Live updates               |
| Deploy     | Kubernetes + Supervisor   | Container orchestration    |

## Key Files Reference

```
Backend:
├── server.py              # Main API with all endpoints
├── simulation_engine.py   # 6-step simulation workflow
├── analytics_engine.py    # AI analytics processing
└── report_generator.py    # Automated report creation

Frontend:
├── App.tsx                              # Routes and layout
├── pages/AIAnalyticsSimulation.tsx      # Main simulation UI
├── pages/EnhancedAnalytics.tsx          # Advanced analytics
├── components/Sidebar.tsx               # Navigation
└── components/chat/AgriChatbot.tsx      # AI chatbot

Database:
└── MongoDB collections (vida_ai_db):
    ├── ai_simulations        # Simulation runs and results
    ├── prediction_analytics  # Generated analytics
    ├── automated_reports     # Generated reports
    └── dispatch_history      # Technician assignments
```

## API Quick Reference

```bash
# Health Check
GET /api/health

# Start Simulation
POST /api/ai-analytics/simulate-failure
Body: { failure_mode: "bearing_wear", equipment_id: "pump-001" }

# Get Simulation Results
GET /api/ai-analytics/simulation/{id}

# Real-time Updates (WebSocket)
WS /ws/simulation-progress/{id}

# List Simulations
GET /api/ai-analytics/simulations

# Generate Analytics
POST /api/predictions/{id}/generate-analytics

# Generate Report
POST /api/analytics/{id}/generate-report

# AI Chatbot
POST /api/chatbot/message
Body: { message: "...", session_id: "..." }
```

## Environment Setup

```bash
# Backend (via Supervisor)
MONGO_URL=mongodb://localhost:27017
DB_NAME=vida_ai_db
EMERGENT_LLM_KEY=sk-emergent-...

# Frontend (.env)
VITE_BACKEND_URL=https://agriassistant.preview.emergentagent.com
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=placeholder_key
```

## Service Ports

```
Frontend:  Port 3000  (Vite dev server)
Backend:   Port 8001  (FastAPI/Uvicorn)
MongoDB:   Port 27017 (Database)
Nginx:     Port 443   (HTTPS ingress)
```

## URL Routing

```
/                          → Frontend (React SPA)
/ai-analytics-simulation   → Simulation page
/analytics-enhanced        → Enhanced analytics
/api/*                     → Backend API
/ws/*                      → WebSocket connections
```

## System Capabilities Checklist

✅ AI-powered failure prediction  
✅ Automated analytics generation  
✅ Intelligent report creation  
✅ Smart technician dispatch  
✅ Interactive 6-step simulation  
✅ Real-time WebSocket updates  
✅ AI chatbot assistance  
✅ Complete historical data storage  
✅ 3 failure mode scenarios  
✅ Production-ready architecture  

## Quick Start Commands

```bash
# Check services status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.out.log

# Test backend health
curl http://localhost:8001/api/health

# Test simulation
curl -X POST http://localhost:8001/api/ai-analytics/simulate-failure \
  -H "Content-Type: application/json" \
  -d '{"failure_mode":"bearing_wear","equipment_id":"pump-001"}'
```

## Access URLs

🌐 **Live Application:**  
https://agriassistant.preview.emergentagent.com

📊 **AI Simulation Page:**  
https://agriassistant.preview.emergentagent.com/ai-analytics-simulation

🔧 **API Health:**  
https://agriassistant.preview.emergentagent.com/api/health

---

**For complete architecture details, see:** `/app/SYSTEM_ARCHITECTURE.md`
