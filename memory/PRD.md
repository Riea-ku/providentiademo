# VIDA - Predictive Maintenance Platform
## Product Requirements Document

### Overview
VIDA is an AI-powered predictive maintenance platform that uses machine learning to predict equipment failures, automate work order creation, and provide intelligent analytics for agricultural and industrial operations.

### Original Problem Statement
Build a functional AI Analytics feature from a UI shell with:
- 6-step simulation workflow with backend logic
- Database integration (MongoDB)
- Real-time frontend updates
- Historical Intelligence System for storing/searching historical data
- AI Conversational Creation replacing all form-based "Add" buttons

---

## What's Been Implemented (as of January 27, 2026)

### ✅ Core Features (WORKING)

#### 1. AI Analytics Simulation
- **Status**: COMPLETE & WORKING
- **20 Dynamic Demo Cases**: Equipment failure predictions across various types (bearings, motors, pumps, etc.)
- **6-Step Pipeline**: 
  1. AI Generates Failure Prediction
  2. Analytics & Impact Assessment  
  3. Report Auto-Generation
  4. Inventory Check & Reservation
  5. Technician Auto-Dispatch
  6. Notifications Sent
- **Real-time Updates**: WebSocket integration with polling fallback
- **Files**: `/backend/simulation_engine.py`, `/frontend/src/pages/AIAnalyticsSimulation.tsx`

#### 2. AI Conversational Creation
- **Status**: COMPLETE & WORKING
- **Supported Entity Types**: Farms, Equipment, Work Orders, Inventory
- **Dynamic Question Flow**: Adapts based on entity type and subtype
- **API Endpoints**: `/api/ai-creation/start`, `/api/ai-creation/next`
- **Files**: `/backend/services/ai_entity_creation.py`, `/frontend/src/pages/AICreationDemo.tsx`

#### 3. Intelligent Report Generation  
- **Status**: COMPLETE & WORKING
- **Report Types**: Maintenance Summary, Equipment Analysis, Cost Analysis, Prediction, Technician Performance, Weekly Summary, Monthly Summary
- **AI-Powered**: Uses Claude Sonnet 4.5 via Emergent LLM Key
- **Professional Format**: Follows user-provided examples with sections (Overview, Findings, Action Items, Conclusion)
- **Files**: `/backend/services/intelligent_report_generator.py`, `/frontend/src/pages/Reports.tsx`

#### 4. Historical Intelligence System
- **Status**: PARTIAL (MongoDB-only mode)
- **PostgreSQL**: Optional - app works without it
- **Pattern Recognition**: Available via MongoDB data
- **Historical Chatbot**: Real-time data queries working
- **Files**: `/backend/services/historical_chatbot.py`, `/backend/services/pattern_recognizer.py`

#### 5. Dashboard & Navigation
- **Status**: COMPLETE
- **Sidebar Navigation**: All pages accessible
- **Real-time Stats**: Equipment count, work orders, predictions

---

## Technical Architecture

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (primary), PostgreSQL with pgvector (optional)
- **AI/LLM**: Anthropic Claude Sonnet 4.5 via Emergent LLM Key
- **Real-time**: WebSocket for simulation updates

### Frontend  
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State**: React hooks, fetch API

### Key Files
```
/app
├── backend/
│   ├── server.py              # Main FastAPI server
│   ├── simulation_engine.py   # 6-step AI simulation
│   ├── db_manager.py          # MongoDB + PostgreSQL (optional)
│   └── services/
│       ├── ai_entity_creation.py       # Conversational creation
│       ├── intelligent_report_generator.py  # AI report generation
│       ├── historical_chatbot.py       # Real-time data queries
│       └── pattern_recognizer.py       # Pattern analysis
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── AIAnalyticsSimulation.tsx
│       │   ├── AICreationDemo.tsx
│       │   └── Reports.tsx
│       └── components/
```

---

## API Endpoints

### AI Analytics
- `GET /api/ai-analytics/demo-cases` - Get 20 demo prediction cases
- `POST /api/ai-analytics/simulate-failure` - Run 6-step simulation
- `GET /api/ai-analytics/simulation/{id}` - Get simulation status

### AI Creation
- `POST /api/ai-creation/start` - Start conversational creation
- `POST /api/ai-creation/next` - Process answer, get next question

### Reports
- `POST /api/reports/generate-intelligent` - Generate AI-powered report
- `GET /api/generated-reports` - List all generated reports

---

## Prioritized Backlog

### P0 (Critical) - DONE ✅
- [x] Fix AI Conversational Creation "failed to start" error
- [x] Fix AI Analytics Simulation not running
- [x] Add 20 dynamic demo cases for simulation
- [x] Fix Report Generation with professional format

### P1 (High Priority)
- [ ] Integrate AICreationDialog into main Equipment/Farms/Work Orders pages
- [ ] Fix vector embedding dimension mismatch (384 vs 1536) for better search
- [ ] Lazy-load Supabase components to fix stability issues
- [ ] Add user authentication

### P2 (Medium Priority)  
- [ ] Cross-entity historical linking (equipment → predictions → reports)
- [ ] Temporal analysis of system evolution
- [ ] Automated historical report generation for trends
- [ ] Export reports to PDF

### P3 (Low Priority)
- [ ] Predictive intelligence based on historical patterns
- [ ] Email notifications for critical alerts
- [ ] Mobile-responsive improvements

---

## Testing Status

**Last Test**: January 27, 2026
- Backend: 16/16 tests passed (100%)
- Frontend: All pages load, all features working (100%)
- Test Report: `/app/test_reports/iteration_1.json`

---

## Known Limitations

1. **PostgreSQL Optional**: Historical search uses simple keyword matching when PostgreSQL unavailable
2. **Supabase**: Using placeholder keys - needs proper lazy-loading
3. **No Authentication**: Currently no user login system

---

## Environment Variables

### Backend (`/app/backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=failure_prediction_db
EMERGENT_LLM_KEY=sk-emergent-xxxxx
```

### Frontend (`/app/frontend/.env`)
```
VITE_BACKEND_URL=https://xxx.emergentsite.com
```
