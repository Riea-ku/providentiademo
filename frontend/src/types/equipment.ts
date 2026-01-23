export type EquipmentType = 'solar_water_pump' | 'irrigation_system' | 'tractor_engine';

export type MaintenanceUrgency = 'low' | 'medium' | 'high' | 'critical';

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'FAILURE';

export interface SensorData {
  // Solar Water Pump
  flow_rate_lmin?: number;
  pressure_bar?: number;
  vibration_mms?: number;
  bearing_temperature_c?: number;
  operating_hours?: number;
  power_consumption_w?: number;
  
  // Irrigation System
  filter_pressure_drop?: number;
  system_efficiency?: number;
  valve_position_percent?: number;
  
  // Tractor Engine
  engine_rpm?: number;
  oil_temperature_c?: number;
  coolant_temperature_c?: number;
  engine_load_percent?: number;
  fuel_consumption_lh?: number;
}

export interface DetectedFailure {
  sensor: string;
  value: number;
  issue: 'HIGH' | 'LOW';
  normal_range: string;
  message: string;
}

export interface PredictionResult {
  prediction: HealthStatus;
  confidence: number;
  failure_probability: number;
  failure_type: string;
  time_to_failure: string;
  maintenance_urgency: MaintenanceUrgency;
  detected_failures: DetectedFailure[];
  impact_message: string;
  cost_estimate?: CostEstimate;
}

export interface CostEstimate {
  labor_hours: number;
  parts_cost: number;
  total_cost: number;
  description: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  farm_id: string;
  status: HealthStatus;
  last_prediction?: PredictionResult;
  sensor_data?: SensorData;
  last_updated: Date;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  equipment_count: number;
  active_alerts: number;
}

export interface WorkOrder {
  id: string;
  equipment_id: string;
  equipment_name: string;
  priority: MaintenanceUrgency;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  failure_type: string;
  estimated_cost: number;
  created_at: Date;
  scheduled_for?: Date;
}

export interface SystemStats {
  total_predictions: number;
  total_equipment: number;
  active_alerts: number;
  healthy_equipment: number;
  pending_work_orders: number;
  total_farms: number;
}

export const EQUIPMENT_CONFIG = {
  solar_water_pump: {
    name: 'Solar Water Pump',
    icon: '☀️',
    sensors: [
      { key: 'flow_rate_lmin', label: 'Flow Rate', unit: 'L/min', min: 0, max: 200, default: 120 },
      { key: 'pressure_bar', label: 'Pressure', unit: 'bar', min: 0, max: 10, default: 4.5, step: 0.1 },
      { key: 'vibration_mms', label: 'Vibration', unit: 'mm/s', min: 0, max: 20, default: 3.0, step: 0.1 },
      { key: 'bearing_temperature_c', label: 'Bearing Temp', unit: '°C', min: 0, max: 150, default: 65 },
      { key: 'operating_hours', label: 'Operating Hours', unit: 'hrs', min: 0, max: 10000, default: 1500 },
    ],
    thresholds: {
      flow_rate_lmin: { low: 50, high: 170 },
      pressure_bar: { low: 2, high: 7 },
      vibration_mms: { high: 8 },
      bearing_temperature_c: { high: 85 },
      operating_hours: { high: 2500 },
    },
  },
  irrigation_system: {
    name: 'Irrigation System',
    icon: '💧',
    sensors: [
      { key: 'pressure_bar', label: 'Pressure', unit: 'bar', min: 0, max: 15, default: 6.0, step: 0.1 },
      { key: 'flow_rate_lmin', label: 'Flow Rate', unit: 'L/min', min: 0, max: 500, default: 200 },
      { key: 'filter_pressure_drop', label: 'Filter Pressure Drop', unit: 'bar', min: 0, max: 3, default: 0.5, step: 0.1 },
      { key: 'system_efficiency', label: 'System Efficiency', unit: '', min: 0, max: 1, default: 0.85, step: 0.01 },
    ],
    thresholds: {
      pressure_bar: { low: 3, high: 10 },
      flow_rate_lmin: { low: 80 },
      filter_pressure_drop: { high: 1.2 },
      system_efficiency: { low: 0.7 },
    },
  },
  tractor_engine: {
    name: 'Tractor Engine',
    icon: '🚜',
    sensors: [
      { key: 'engine_rpm', label: 'Engine RPM', unit: 'RPM', min: 0, max: 3500, default: 1800 },
      { key: 'oil_temperature_c', label: 'Oil Temp', unit: '°C', min: 0, max: 150, default: 85 },
      { key: 'coolant_temperature_c', label: 'Coolant Temp', unit: '°C', min: 0, max: 120, default: 82 },
      { key: 'engine_load_percent', label: 'Engine Load', unit: '%', min: 0, max: 100, default: 65 },
    ],
    thresholds: {
      engine_rpm: { low: 1000, high: 2200 },
      oil_temperature_c: { high: 100 },
      coolant_temperature_c: { high: 95 },
      engine_load_percent: { high: 85 },
    },
  },
} as const;