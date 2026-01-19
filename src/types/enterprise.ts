// ================================================
// PROVIDENTIA ENTERPRISE AGRICULTURAL MANAGEMENT SYSTEM
// © 2026 AgriProvidentia Technologies
// Type Definitions
// ================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tool_calls?: ToolCall[];
  entities_referenced?: EntityReferences;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface EntityReferences {
  equipment_ids?: string[];
  work_order_ids?: string[];
  technician_ids?: string[];
  prediction_ids?: string[];
}

export interface Farm {
  id: string;
  name: string;
  location: string | null;
  size_hectares: number | null;
  gps_coordinates: { lat: number; lng: number } | null;
  contact_email: string | null;
  contact_phone: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type EquipmentStatus = 'operational' | 'warning' | 'critical' | 'maintenance' | 'decommissioned';

export interface Equipment {
  id: string;
  farm_id: string | null;
  equipment_code: string;
  name: string;
  equipment_type: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: EquipmentStatus;
  location_gps: { lat: number; lng: number } | null;
  current_operating_hours: number;
  last_service_date: string | null;
  next_service_due: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  farms?: Farm;
}

export interface Prediction {
  id: string;
  equipment_id: string;
  sensor_data: SensorData;
  prediction_result: PredictionResult;
  failure_types: DetectedFailure[];
  health_score: number;
  time_to_failure_hours: number;
  maintenance_urgency: string;
  estimated_cost: number;
  confidence_score: number;
  auto_created_work_order_id: string | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  equipment?: Equipment;
}

export interface SensorData {
  motor_temp: number;
  vibration: number;
  power_output: number;
  flow_rate: number;
  pressure: number;
  [key: string]: number;
}

export interface DetectedFailure {
  type: string;
  severity: 'warning' | 'critical';
}

export interface PredictionResult {
  equipment_code: string;
  equipment_name: string;
  health_score: number;
  failures: DetectedFailure[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  time_to_failure_hours: number;
  estimated_cost: number;
  sensor_data: SensorData;
  recommendation: string;
}

export type WorkOrderStatus = 'pending' | 'scheduled' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  equipment_id: string | null;
  prediction_id: string | null;
  title: string;
  description: string | null;
  work_type: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assigned_technician_id: string | null;
  facility_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  parts_required: any | null;
  parts_used: any | null;
  labor_hours: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  notes: string | null;
  completion_notes: string | null;
  created_by: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  equipment?: Equipment;
  technicians?: Technician;
}

export type TechnicianStatus = 'available' | 'on_job' | 'on_break' | 'off_duty' | 'on_leave';

export interface Technician {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: TechnicianStatus;
  skills: string[];
  hourly_rate: number | null;
  current_location_gps: { lat: number; lng: number } | null;
  work_schedule: any | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  farm_id: string | null;
  part_number: string;
  name: string;
  description: string | null;
  category: string | null;
  vendor_id: string | null;
  manufacturer_id: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point: number;
  reorder_quantity: number;
  unit_cost: number | null;
  location_bin: string | null;
  barcode: string | null;
  rfid_tag: string | null;
  compatible_equipment: string[];
  last_restock_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  vendor_code: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: string | null;
  lead_time_days: number;
  rating: number | null;
  is_preferred: boolean;
  categories: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'shipped' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string | null;
  status: PurchaseOrderStatus;
  line_items: any[];
  subtotal: number | null;
  tax: number;
  shipping: number;
  total: number | null;
  requested_delivery_date: string | null;
  actual_delivery_date: string | null;
  triggered_by_work_order_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vendors?: Vendor;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  source_table: string | null;
  source_id: string | null;
  equipment_id: string | null;
  work_order_id: string | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  auto_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface SystemStats {
  total_equipment: number;
  operational_count: number;
  warning_count: number;
  critical_count: number;
  active_work_orders: number;
  low_stock_items: number;
  available_technicians: number;
  unacknowledged_alerts: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: 'equipment' | 'maintenance' | 'inventory' | 'analytics' | 'scheduling';
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'check-equipment', label: 'Check Equipment', icon: '🔍', prompt: 'Show me all equipment with warnings or critical status', category: 'equipment' },
  { id: 'run-prediction', label: 'Run Prediction', icon: '🔮', prompt: 'Run a health prediction on all tractors', category: 'equipment' },
  { id: 'active-orders', label: 'Active Work Orders', icon: '📋', prompt: 'Show all active work orders', category: 'maintenance' },
  { id: 'schedule-tech', label: 'Schedule Technician', icon: '👨‍🔧', prompt: 'Show available technicians and their skills', category: 'scheduling' },
  { id: 'low-inventory', label: 'Low Inventory', icon: '📦', prompt: 'Show all items that need reordering', category: 'inventory' },
  { id: 'create-po', label: 'Create Purchase Order', icon: '🛒', prompt: 'Help me create a purchase order for low stock items', category: 'inventory' },
  { id: 'costs-report', label: 'Cost Report', icon: '💰', prompt: 'Show me a cost breakdown for this month', category: 'analytics' },
  { id: 'equipment-health', label: 'Health Overview', icon: '❤️', prompt: 'Give me an equipment health overview', category: 'analytics' },
  { id: 'book-facility', label: 'Book Facility', icon: '🏭', prompt: 'Show available facilities and help me book one', category: 'scheduling' },
  { id: 'alerts', label: 'View Alerts', icon: '🚨', prompt: 'Show all unacknowledged alerts', category: 'maintenance' },
];
