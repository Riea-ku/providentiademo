import { 
  EquipmentType, 
  SensorData, 
  PredictionResult, 
  DetectedFailure,
  CostEstimate,
  MaintenanceUrgency,
  HealthStatus,
  EQUIPMENT_CONFIG 
} from '@/types/equipment';

// Cost templates for maintenance
const COST_TEMPLATES: Record<string, Record<string, CostEstimate>> = {
  solar_water_pump: {
    bearing_failure: { labor_hours: 4, parts_cost: 85, total_cost: 265, description: 'Bearing replacement' },
    motor_overheating: { labor_hours: 6, parts_cost: 120, total_cost: 390, description: 'Motor service & cooling' },
    impeller_clogged: { labor_hours: 2, parts_cost: 25, total_cost: 115, description: 'Impeller cleaning' },
    overpressure: { labor_hours: 3, parts_cost: 45, total_cost: 180, description: 'Pressure system repair' },
    underpressure: { labor_hours: 3, parts_cost: 60, total_cost: 195, description: 'Pump priming & seal check' },
  },
  irrigation_system: {
    pressure_loss: { labor_hours: 5, parts_cost: 75, total_cost: 300, description: 'Line pressure restoration' },
    filter_clogged: { labor_hours: 2, parts_cost: 30, total_cost: 120, description: 'Filter replacement' },
    efficiency_loss: { labor_hours: 4, parts_cost: 90, total_cost: 270, description: 'System optimization' },
  },
  tractor_engine: {
    overheating: { labor_hours: 8, parts_cost: 150, total_cost: 510, description: 'Cooling system repair' },
    overload: { labor_hours: 3, parts_cost: 40, total_cost: 175, description: 'Load calibration' },
    over_revving: { labor_hours: 5, parts_cost: 110, total_cost: 335, description: 'Governor adjustment' },
  },
};

const HOURLY_RATE = 45;

function detectFailures(sensorData: SensorData, equipmentType: EquipmentType): DetectedFailure[] {
  const failures: DetectedFailure[] = [];
  const config = EQUIPMENT_CONFIG[equipmentType];
  const thresholds = config.thresholds as Record<string, { low?: number; high?: number }>;
  
  for (const sensor of config.sensors) {
    const value = sensorData[sensor.key as keyof SensorData] as number | undefined;
    if (value === undefined) continue;
    
    const threshold = thresholds[sensor.key];
    if (!threshold) continue;
    
    if (threshold.low !== undefined && value < threshold.low) {
      failures.push({
        sensor: sensor.key,
        value,
        issue: 'LOW',
        normal_range: `${threshold.low}-${threshold.high ?? 'N/A'} ${sensor.unit}`,
        message: `${sensor.label} too low: ${value} ${sensor.unit} (normal: >${threshold.low} ${sensor.unit})`,
      });
    } else if (threshold.high !== undefined && value > threshold.high) {
      failures.push({
        sensor: sensor.key,
        value,
        issue: 'HIGH',
        normal_range: `${threshold.low ?? 'N/A'}-${threshold.high} ${sensor.unit}`,
        message: `${sensor.label} too high: ${value} ${sensor.unit} (normal: <${threshold.high} ${sensor.unit})`,
      });
    }
  }
  
  return failures;
}

function getFailureType(failures: DetectedFailure[], equipmentType: EquipmentType): string {
  if (failures.length === 0) return 'no_failure';
  
  const criticalSensors: Record<EquipmentType, string[]> = {
    solar_water_pump: ['vibration_mms', 'bearing_temperature_c', 'pressure_bar', 'flow_rate_lmin'],
    irrigation_system: ['pressure_bar', 'system_efficiency', 'filter_pressure_drop'],
    tractor_engine: ['oil_temperature_c', 'coolant_temperature_c', 'engine_rpm', 'engine_load_percent'],
  };
  
  const equipmentCritical = criticalSensors[equipmentType];
  
  for (const sensor of equipmentCritical) {
    const failure = failures.find(f => f.sensor === sensor);
    if (!failure) continue;
    
    if (equipmentType === 'solar_water_pump') {
      if (sensor === 'vibration_mms' && failure.issue === 'HIGH') return 'bearing_failure';
      if (sensor === 'flow_rate_lmin' && failure.issue === 'LOW') return 'impeller_clogged';
      if (sensor === 'bearing_temperature_c' && failure.issue === 'HIGH') return 'motor_overheating';
      if (sensor === 'pressure_bar' && failure.issue === 'HIGH') return 'overpressure';
      if (sensor === 'pressure_bar' && failure.issue === 'LOW') return 'underpressure';
    } else if (equipmentType === 'irrigation_system') {
      if (sensor === 'pressure_bar' && failure.issue === 'LOW') return 'pressure_loss';
      if (sensor === 'system_efficiency' && failure.issue === 'LOW') return 'efficiency_loss';
      if (sensor === 'filter_pressure_drop' && failure.issue === 'HIGH') return 'filter_clogged';
    } else if (equipmentType === 'tractor_engine') {
      if (['oil_temperature_c', 'coolant_temperature_c'].includes(sensor) && failure.issue === 'HIGH') return 'overheating';
      if (sensor === 'engine_rpm' && failure.issue === 'HIGH') return 'over_revving';
      if (sensor === 'engine_load_percent' && failure.issue === 'HIGH') return 'overload';
    }
  }
  
  return failures.length > 1 ? 'multiple_issues' : 'general_failure';
}

function calculateUrgency(failures: DetectedFailure[], equipmentType: EquipmentType): MaintenanceUrgency {
  if (failures.length === 0) return 'low';
  
  let riskScore = 0;
  
  if (equipmentType === 'solar_water_pump') {
    const flowRate = failures.find(f => f.sensor === 'flow_rate_lmin');
    const bearingTemp = failures.find(f => f.sensor === 'bearing_temperature_c');
    const vibration = failures.find(f => f.sensor === 'vibration_mms');
    
    if (flowRate && flowRate.value < 30) riskScore += 3;
    if (bearingTemp && bearingTemp.value > 95) riskScore += 3;
    if (vibration && vibration.value > 12) riskScore += 2;
  } else if (equipmentType === 'irrigation_system') {
    const pressure = failures.find(f => f.sensor === 'pressure_bar');
    if (pressure && pressure.value < 1.5) riskScore += 3;
  } else if (equipmentType === 'tractor_engine') {
    const oilTemp = failures.find(f => f.sensor === 'oil_temperature_c');
    const coolantTemp = failures.find(f => f.sensor === 'coolant_temperature_c');
    
    if (oilTemp && oilTemp.value > 110) riskScore += 3;
    if (coolantTemp && coolantTemp.value > 100) riskScore += 2;
  }
  
  if (riskScore >= 3) return 'critical';
  if (riskScore >= 2) return 'high';
  if (failures.length > 0) return 'medium';
  return 'low';
}

function calculateTimeToFailure(urgency: MaintenanceUrgency, equipmentType: EquipmentType): string {
  const timeWindows: Record<EquipmentType, Record<MaintenanceUrgency, string>> = {
    solar_water_pump: {
      critical: '1-2 days',
      high: '3-7 days',
      medium: '8-14 days',
      low: '15-30 days',
    },
    irrigation_system: {
      critical: '1-3 days',
      high: '4-10 days',
      medium: '11-21 days',
      low: '22-45 days',
    },
    tractor_engine: {
      critical: '1-2 days',
      high: '3-6 days',
      medium: '7-14 days',
      low: '15-25 days',
    },
  };
  
  return timeWindows[equipmentType][urgency];
}

function getImpactMessage(failures: DetectedFailure[], equipmentType: EquipmentType, prediction: HealthStatus): string {
  if (prediction === 'HEALTHY') {
    return 'All systems operating within normal parameters. Equipment is healthy.';
  }
  
  if (failures.length === 0) {
    return 'Equipment requires attention.';
  }
  
  if (failures.length === 1) {
    return `${failures[0].message}. Immediate attention recommended.`;
  }
  
  const highIssues = failures.filter(f => f.issue === 'HIGH');
  if (highIssues.length > 0) {
    const criticalIssues = highIssues.slice(0, 2).map(f => 
      f.sensor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    ).join(', ');
    return `CRITICAL: Multiple high-risk issues detected (${criticalIssues}). EMERGENCY MAINTENANCE REQUIRED!`;
  }
  
  return `Multiple issues detected (${failures.length} total). Schedule maintenance soon.`;
}

export function runPrediction(sensorData: SensorData, equipmentType: EquipmentType): PredictionResult {
  // Detect failures based on thresholds
  const detectedFailures = detectFailures(sensorData, equipmentType);
  
  // Determine failure type
  const failureType = getFailureType(detectedFailures, equipmentType);
  
  // Calculate urgency
  const urgency = calculateUrgency(detectedFailures, equipmentType);
  
  // Determine prediction result
  const hasFailures = detectedFailures.length > 0;
  const prediction: HealthStatus = hasFailures 
    ? (urgency === 'critical' || urgency === 'high' ? 'FAILURE' : 'WARNING')
    : 'HEALTHY';
  
  // Calculate confidence based on number of failures and their severity
  let confidence = 0.85;
  if (hasFailures) {
    confidence = Math.min(0.95, 0.7 + (detectedFailures.length * 0.05));
  }
  
  // Calculate failure probability
  const failureProbability = hasFailures ? confidence : 0.1;
  
  // Get time to failure
  const timeToFailure = calculateTimeToFailure(urgency, equipmentType);
  
  // Get impact message
  const impactMessage = getImpactMessage(detectedFailures, equipmentType, prediction);
  
  // Get cost estimate
  const costEstimate = COST_TEMPLATES[equipmentType]?.[failureType] || {
    labor_hours: 4,
    parts_cost: 75,
    total_cost: 255,
    description: 'General maintenance',
  };
  
  return {
    prediction,
    confidence,
    failure_probability: failureProbability,
    failure_type: failureType,
    time_to_failure: timeToFailure,
    maintenance_urgency: urgency,
    detected_failures: detectedFailures,
    impact_message: impactMessage,
    cost_estimate: hasFailures ? costEstimate : undefined,
  };
}