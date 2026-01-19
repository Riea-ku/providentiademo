-- ================================================
-- PROVIDENTIA ENTERPRISE AGRICULTURAL MANAGEMENT SYSTEM
-- © 2026 AgriProvidentia Technologies
-- Version 3.0 - LLM-Powered Full Suite
-- ================================================

-- ENUM TYPES for standardized values
CREATE TYPE equipment_status AS ENUM ('operational', 'warning', 'critical', 'maintenance', 'decommissioned');
CREATE TYPE work_order_status AS ENUM ('pending', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE work_order_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE purchase_order_status AS ENUM ('draft', 'pending_approval', 'approved', 'ordered', 'shipped', 'received', 'cancelled');
CREATE TYPE inspection_status AS ENUM ('scheduled', 'in_progress', 'passed', 'failed', 'requires_action');
CREATE TYPE calibration_status AS ENUM ('current', 'due_soon', 'overdue', 'in_progress');
CREATE TYPE technician_status AS ENUM ('available', 'on_job', 'on_break', 'off_duty', 'on_leave');
CREATE TYPE facility_type AS ENUM ('shed', 'workshop', 'storage', 'field', 'office');
CREATE TYPE document_type AS ENUM ('manual', 'certificate', 'report', 'warranty', 'contract', 'invoice', 'other');

-- ================================================
-- 1. FARMS - Top level organizational unit
-- ================================================
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  size_hectares DECIMAL(10,2),
  gps_coordinates JSONB, -- {lat, lng}
  contact_email TEXT,
  contact_phone TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 2. EQUIPMENT - Central entity everything connects to
-- ================================================
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  equipment_code TEXT UNIQUE NOT NULL, -- e.g., "T-789"
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL, -- 'solar_pump', 'irrigation', 'tractor', etc.
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  status equipment_status DEFAULT 'operational',
  location_gps JSONB,
  current_operating_hours DECIMAL(10,2) DEFAULT 0,
  last_service_date DATE,
  next_service_due DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 3. PREDICTIONS - ML prediction history
-- ================================================
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  sensor_data JSONB NOT NULL, -- All sensor readings at prediction time
  prediction_result JSONB NOT NULL, -- Full prediction output
  failure_types JSONB, -- Array of detected failures
  health_score DECIMAL(5,2),
  time_to_failure_hours INTEGER,
  maintenance_urgency TEXT,
  estimated_cost DECIMAL(10,2),
  confidence_score DECIMAL(5,2),
  auto_created_work_order_id UUID, -- Links to work order if auto-created
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 4. VENDORS - Supplier management
-- ================================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vendor_code TEXT UNIQUE,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms TEXT,
  lead_time_days INTEGER DEFAULT 7,
  rating DECIMAL(3,2), -- 0-5 star rating
  is_preferred BOOLEAN DEFAULT false,
  categories TEXT[], -- What they supply
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 5. MANUFACTURERS - Equipment manufacturer info
-- ================================================
CREATE TABLE public.manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  support_portal TEXT,
  warranty_policy TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 6. INVENTORY - Parts, tools, supplies tracking
-- ================================================
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'parts', 'tools', 'supplies', 'consumables'
  vendor_id UUID REFERENCES public.vendors(id),
  manufacturer_id UUID REFERENCES public.manufacturers(id),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0, -- Reserved for work orders
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  reorder_point INTEGER DEFAULT 5,
  reorder_quantity INTEGER DEFAULT 10,
  unit_cost DECIMAL(10,2),
  location_bin TEXT, -- Storage location
  barcode TEXT,
  rfid_tag TEXT,
  compatible_equipment TEXT[], -- Equipment types this fits
  last_restock_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 7. TECHNICIANS - Staff management
-- ================================================
CREATE TABLE public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status technician_status DEFAULT 'available',
  skills TEXT[], -- Array of certifications/skills
  hourly_rate DECIMAL(10,2),
  current_location_gps JSONB,
  work_schedule JSONB, -- Weekly schedule
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 8. FACILITIES - Sheds, workshops, storage
-- ================================================
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  facility_type facility_type NOT NULL,
  capacity INTEGER, -- Max equipment/people
  location_gps JSONB,
  amenities TEXT[],
  is_available BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 9. WORK ORDERS - Central hub connecting everything
-- ================================================
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT UNIQUE NOT NULL, -- e.g., "WO-0001"
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  prediction_id UUID REFERENCES public.predictions(id), -- If created from prediction
  title TEXT NOT NULL,
  description TEXT,
  work_type TEXT, -- 'preventive', 'corrective', 'emergency', 'inspection'
  priority work_order_priority DEFAULT 'medium',
  status work_order_status DEFAULT 'pending',
  assigned_technician_id UUID REFERENCES public.technicians(id),
  facility_id UUID REFERENCES public.facilities(id), -- Where work will be done
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  parts_required JSONB, -- [{part_id, quantity_needed}]
  parts_used JSONB, -- Actual parts consumed
  labor_hours DECIMAL(6,2),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  notes TEXT,
  completion_notes TEXT,
  created_by TEXT,
  completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 10. PURCHASE ORDERS - Procurement workflow
-- ================================================
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL, -- e.g., "PO-0001"
  vendor_id UUID REFERENCES public.vendors(id),
  status purchase_order_status DEFAULT 'draft',
  line_items JSONB NOT NULL, -- [{inventory_id, quantity, unit_price}]
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  requested_delivery_date DATE,
  actual_delivery_date DATE,
  triggered_by_work_order_id UUID REFERENCES public.work_orders(id),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 11. INSPECTIONS - Equipment inspections
-- ================================================
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL, -- 'safety', 'routine', 'compliance', 'pre-operation'
  status inspection_status DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  inspector_id UUID REFERENCES public.technicians(id),
  checklist JSONB, -- [{item, passed, notes}]
  overall_result TEXT,
  issues_found TEXT[],
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_work_order_id UUID REFERENCES public.work_orders(id),
  documents JSONB, -- Linked document IDs
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 12. CALIBRATIONS - Tool/equipment calibration tracking
-- ================================================
CREATE TABLE public.calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  calibration_type TEXT NOT NULL,
  status calibration_status DEFAULT 'current',
  last_calibration_date DATE,
  next_calibration_due DATE NOT NULL,
  calibration_interval_days INTEGER DEFAULT 365,
  performed_by UUID REFERENCES public.technicians(id),
  certificate_number TEXT,
  standards_used TEXT,
  measurements JSONB, -- Before/after readings
  passed BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 13. SERVICE HISTORY - Complete equipment service records
-- ================================================
CREATE TABLE public.service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id),
  service_type TEXT NOT NULL,
  service_date DATE NOT NULL,
  description TEXT,
  parts_replaced JSONB, -- [{part_id, quantity}]
  labor_hours DECIMAL(6,2),
  total_cost DECIMAL(10,2),
  technician_id UUID REFERENCES public.technicians(id),
  operating_hours_at_service DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 14. MAINTENANCE LOGS - Detailed maintenance records
-- ================================================
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id),
  technician_id UUID REFERENCES public.technicians(id),
  log_timestamp TIMESTAMPTZ DEFAULT now(),
  action_taken TEXT NOT NULL,
  time_spent_minutes INTEGER,
  parts_used JSONB,
  findings TEXT,
  next_steps TEXT,
  photos JSONB, -- Array of storage URLs
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 15. COST TRACKING - Track all costs
-- ================================================
CREATE TABLE public.cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_type TEXT NOT NULL, -- 'labor', 'parts', 'external_service', 'equipment_rental'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  equipment_id UUID REFERENCES public.equipment(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  farm_id UUID REFERENCES public.farms(id),
  vendor_id UUID REFERENCES public.vendors(id),
  invoice_number TEXT,
  cost_date DATE DEFAULT CURRENT_DATE,
  billing_period TEXT, -- e.g., "2026-01"
  is_billable BOOLEAN DEFAULT true,
  billed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 16. DOCUMENTS - Document management
-- ================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type document_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  equipment_id UUID REFERENCES public.equipment(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  vendor_id UUID REFERENCES public.vendors(id),
  expiry_date DATE, -- For certificates
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 17. EMPLOYEE WORKING HOURS
-- ================================================
CREATE TABLE public.employee_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES public.technicians(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  regular_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  work_order_id UUID REFERENCES public.work_orders(id), -- If tied to specific work
  notes TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 18. DISPATCH LOGS - Field service tracking
-- ================================================
CREATE TABLE public.dispatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.technicians(id),
  dispatch_time TIMESTAMPTZ DEFAULT now(),
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  travel_distance_km DECIMAL(8,2),
  gps_route JSONB, -- Array of GPS points
  status TEXT DEFAULT 'dispatched', -- 'dispatched', 'en_route', 'on_site', 'completed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 19. FACILITY BOOKINGS - Scheduling facilities
-- ================================================
CREATE TABLE public.facility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id),
  booked_by UUID REFERENCES public.technicians(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  purpose TEXT,
  equipment_id UUID REFERENCES public.equipment(id), -- Equipment being serviced
  status TEXT DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 20. CHAT MESSAGES - LLM conversation history
-- ================================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL, -- Groups messages in a conversation
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  tool_calls JSONB, -- If assistant made tool calls
  tool_results JSONB, -- Results from tool execution
  entities_referenced JSONB, -- {equipment_ids: [], work_order_ids: [], etc.}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 21. SYSTEM EVENTS - Event bus for interconnections
-- ================================================
CREATE TABLE public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'prediction_created', 'work_order_created', 'inventory_low', etc.
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  event_data JSONB NOT NULL,
  triggered_actions JSONB, -- What actions were auto-triggered
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 22. ALERTS & NOTIFICATIONS
-- ================================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'critical_failure', 'low_inventory', 'calibration_due', etc.
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
  equipment_id UUID REFERENCES public.equipment(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  auto_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- INDEXES for performance
-- ================================================
CREATE INDEX idx_equipment_farm ON public.equipment(farm_id);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_predictions_equipment ON public.predictions(equipment_id);
CREATE INDEX idx_predictions_created ON public.predictions(created_at DESC);
CREATE INDEX idx_work_orders_equipment ON public.work_orders(equipment_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_technician ON public.work_orders(assigned_technician_id);
CREATE INDEX idx_inventory_quantity ON public.inventory(quantity_on_hand);
CREATE INDEX idx_purchase_orders_vendor ON public.purchase_orders(vendor_id);
CREATE INDEX idx_service_history_equipment ON public.service_history(equipment_id);
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_system_events_type ON public.system_events(event_type);
CREATE INDEX idx_alerts_acknowledged ON public.alerts(acknowledged);

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES - Public access for now (add auth later)
-- ================================================
CREATE POLICY "Allow all access to farms" ON public.farms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to equipment" ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to predictions" ON public.predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to manufacturers" ON public.manufacturers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to technicians" ON public.technicians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to facilities" ON public.facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to work_orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to calibrations" ON public.calibrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to service_history" ON public.service_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to maintenance_logs" ON public.maintenance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cost_tracking" ON public.cost_tracking FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to employee_hours" ON public.employee_hours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dispatch_logs" ON public.dispatch_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to facility_bookings" ON public.facility_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_events" ON public.system_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- FUNCTION: Generate sequential work order numbers
-- ================================================
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.work_orders;
  
  NEW.work_order_number := 'WO-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_work_order_number
  BEFORE INSERT ON public.work_orders
  FOR EACH ROW
  WHEN (NEW.work_order_number IS NULL)
  EXECUTE FUNCTION generate_work_order_number();

-- ================================================
-- FUNCTION: Generate sequential PO numbers
-- ================================================
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.purchase_orders;
  
  NEW.po_number := 'PO-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW
  WHEN (NEW.po_number IS NULL)
  EXECUTE FUNCTION generate_po_number();

-- ================================================
-- FUNCTION: Update timestamps
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_farms_timestamp BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_equipment_timestamp BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vendors_timestamp BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_timestamp BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_technicians_timestamp BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_work_orders_timestamp BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_purchase_orders_timestamp BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- SEED DATA: Sample farm, equipment, technicians
-- ================================================
INSERT INTO public.farms (name, location, size_hectares, contact_email) VALUES
  ('North Valley Farm', 'California, USA', 250.5, 'north@agriprovidentia.com'),
  ('South Ridge Ranch', 'Texas, USA', 500.0, 'south@agriprovidentia.com'),
  ('East Coast Organics', 'Florida, USA', 175.25, 'east@agriprovidentia.com');

INSERT INTO public.manufacturers (name, contact_email, website) VALUES
  ('John Deere', 'support@deere.com', 'https://www.deere.com'),
  ('Grundfos Pumps', 'support@grundfos.com', 'https://www.grundfos.com'),
  ('Netafim Irrigation', 'support@netafim.com', 'https://www.netafim.com');

INSERT INTO public.vendors (name, vendor_code, email, lead_time_days, is_preferred, categories) VALUES
  ('AgriParts Direct', 'VND-001', 'orders@agriparts.com', 3, true, ARRAY['parts', 'tools']),
  ('Farm Supply Co', 'VND-002', 'sales@farmsupply.com', 5, false, ARRAY['supplies', 'consumables']),
  ('Industrial Bearings Inc', 'VND-003', 'orders@indbearings.com', 2, true, ARRAY['parts']);

INSERT INTO public.technicians (employee_id, first_name, last_name, email, skills, hourly_rate, status) VALUES
  ('TECH-001', 'Marcus', 'Johnson', 'marcus@agriprovidentia.com', ARRAY['electrical', 'hydraulics', 'engines'], 45.00, 'available'),
  ('TECH-002', 'Sarah', 'Williams', 'sarah@agriprovidentia.com', ARRAY['irrigation', 'pumps', 'solar'], 42.00, 'available'),
  ('TECH-003', 'David', 'Chen', 'david@agriprovidentia.com', ARRAY['tractors', 'implements', 'diagnostics'], 48.00, 'available');

INSERT INTO public.equipment (farm_id, equipment_code, name, equipment_type, manufacturer, model, status, current_operating_hours) VALUES
  ((SELECT id FROM farms WHERE name = 'North Valley Farm'), 'T-789', 'Main Field Tractor', 'tractor', 'John Deere', '8R 410', 'operational', 2450.5),
  ((SELECT id FROM farms WHERE name = 'North Valley Farm'), 'SP-001', 'Solar Irrigation Pump A', 'solar_pump', 'Grundfos', 'SQFlex', 'operational', 8760.0),
  ((SELECT id FROM farms WHERE name = 'North Valley Farm'), 'IR-101', 'Center Pivot Irrigation', 'irrigation', 'Netafim', 'SuperNet', 'operational', 5200.0),
  ((SELECT id FROM farms WHERE name = 'South Ridge Ranch'), 'T-456', 'Ranch Tractor', 'tractor', 'John Deere', '6M Series', 'warning', 3100.0),
  ((SELECT id FROM farms WHERE name = 'South Ridge Ranch'), 'SP-002', 'Well Pump Station', 'solar_pump', 'Grundfos', 'SP Series', 'operational', 12000.0);

INSERT INTO public.inventory (part_number, name, category, quantity_on_hand, reorder_point, unit_cost, compatible_equipment) VALUES
  ('BRG-6205', 'Ball Bearing 6205-2RS', 'parts', 15, 5, 24.99, ARRAY['solar_pump', 'irrigation']),
  ('FLT-HYD-001', 'Hydraulic Oil Filter', 'parts', 8, 3, 45.00, ARRAY['tractor']),
  ('BLT-V-42', 'V-Belt 42 inch', 'parts', 12, 4, 18.50, ARRAY['solar_pump', 'irrigation']),
  ('OIL-15W40', 'Engine Oil 15W-40 (5L)', 'consumables', 20, 10, 35.00, ARRAY['tractor']),
  ('SEAL-PUMP-01', 'Pump Mechanical Seal', 'parts', 6, 2, 89.00, ARRAY['solar_pump']);

INSERT INTO public.facilities (farm_id, name, facility_type, capacity, is_available) VALUES
  ((SELECT id FROM farms WHERE name = 'North Valley Farm'), 'Main Workshop', 'workshop', 4, true),
  ((SELECT id FROM farms WHERE name = 'North Valley Farm'), 'Equipment Shed A', 'shed', 8, true),
  ((SELECT id FROM farms WHERE name = 'South Ridge Ranch'), 'Service Bay', 'workshop', 2, true);