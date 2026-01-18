import { useState } from 'react';
import { ChevronRight, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Equipment, HealthStatus, EQUIPMENT_CONFIG } from '@/types/equipment';

// Mock data for demo
const mockEquipment: Equipment[] = [
  {
    id: 'pump_001',
    name: 'Solar Pump Station A',
    type: 'solar_water_pump',
    farm_id: 'farm_001',
    status: 'HEALTHY',
    last_updated: new Date(),
    sensor_data: { flow_rate_lmin: 118, pressure_bar: 4.2, vibration_mms: 2.8, bearing_temperature_c: 62 },
  },
  {
    id: 'irrigation_001',
    name: 'Main Irrigation Grid',
    type: 'irrigation_system',
    farm_id: 'farm_001',
    status: 'WARNING',
    last_updated: new Date(),
    sensor_data: { pressure_bar: 4.8, flow_rate_lmin: 165, filter_pressure_drop: 1.1, system_efficiency: 0.72 },
    last_prediction: {
      prediction: 'WARNING',
      confidence: 0.78,
      failure_probability: 0.45,
      failure_type: 'efficiency_loss',
      time_to_failure: '11-21 days',
      maintenance_urgency: 'medium',
      detected_failures: [{ sensor: 'system_efficiency', value: 0.72, issue: 'LOW', normal_range: '>0.7', message: 'System efficiency degraded' }],
      impact_message: 'System efficiency degraded. Schedule maintenance soon.',
    },
  },
  {
    id: 'tractor_001',
    name: 'John Deere 6M',
    type: 'tractor_engine',
    farm_id: 'farm_001',
    status: 'FAILURE',
    last_updated: new Date(),
    sensor_data: { engine_rpm: 1820, oil_temperature_c: 108, coolant_temperature_c: 98, engine_load_percent: 78 },
    last_prediction: {
      prediction: 'FAILURE',
      confidence: 0.92,
      failure_probability: 0.85,
      failure_type: 'overheating',
      time_to_failure: '1-2 days',
      maintenance_urgency: 'critical',
      detected_failures: [
        { sensor: 'oil_temperature_c', value: 108, issue: 'HIGH', normal_range: '<100°C', message: 'Oil temperature critical' },
        { sensor: 'coolant_temperature_c', value: 98, issue: 'HIGH', normal_range: '<95°C', message: 'Coolant temperature elevated' },
      ],
      impact_message: 'CRITICAL: Multiple high-risk issues detected. EMERGENCY MAINTENANCE REQUIRED!',
      cost_estimate: { labor_hours: 8, parts_cost: 150, total_cost: 510, description: 'Cooling system repair' },
    },
  },
  {
    id: 'pump_002',
    name: 'Solar Pump Station B',
    type: 'solar_water_pump',
    farm_id: 'farm_002',
    status: 'HEALTHY',
    last_updated: new Date(),
    sensor_data: { flow_rate_lmin: 125, pressure_bar: 4.8, vibration_mms: 2.2, bearing_temperature_c: 58 },
  },
  {
    id: 'irrigation_002',
    name: 'South Field Drip System',
    type: 'irrigation_system',
    farm_id: 'farm_002',
    status: 'HEALTHY',
    last_updated: new Date(),
    sensor_data: { pressure_bar: 5.5, flow_rate_lmin: 210, filter_pressure_drop: 0.4, system_efficiency: 0.88 },
  },
];

const statusConfig: Record<HealthStatus, { icon: React.ReactNode; className: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  HEALTHY: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: 'text-success',
    badgeVariant: 'secondary',
  },
  WARNING: {
    icon: <AlertTriangle className="h-4 w-4" />,
    className: 'text-warning',
    badgeVariant: 'outline',
  },
  FAILURE: {
    icon: <Activity className="h-4 w-4" />,
    className: 'text-destructive',
    badgeVariant: 'destructive',
  },
};

export function EquipmentOverview() {
  const [filter, setFilter] = useState<HealthStatus | 'ALL'>('ALL');
  
  const filteredEquipment = filter === 'ALL' 
    ? mockEquipment 
    : mockEquipment.filter(e => e.status === filter);
  
  const counts = {
    ALL: mockEquipment.length,
    HEALTHY: mockEquipment.filter(e => e.status === 'HEALTHY').length,
    WARNING: mockEquipment.filter(e => e.status === 'WARNING').length,
    FAILURE: mockEquipment.filter(e => e.status === 'FAILURE').length,
  };
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Equipment Status</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            View All <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3">
          {(['ALL', 'HEALTHY', 'WARNING', 'FAILURE'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status)}
              className={cn(
                "text-xs gap-1.5",
                filter === status && status === 'HEALTHY' && "text-success",
                filter === status && status === 'WARNING' && "text-warning",
                filter === status && status === 'FAILURE' && "text-destructive"
              )}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                {counts[status]}
              </Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredEquipment.map((equipment) => {
          const config = EQUIPMENT_CONFIG[equipment.type];
          const status = statusConfig[equipment.status];
          
          return (
            <div
              key={equipment.id}
              className={cn(
                "p-4 rounded-lg border border-border/30 bg-secondary/20",
                "hover:bg-secondary/40 transition-colors cursor-pointer",
                equipment.status === 'FAILURE' && "border-destructive/30",
                equipment.status === 'WARNING' && "border-warning/30"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-xl">
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{equipment.name}</h4>
                    <p className="text-xs text-muted-foreground">{config.name} • {equipment.farm_id}</p>
                  </div>
                </div>
                <Badge 
                  variant={status.badgeVariant}
                  className={cn("gap-1", status.className)}
                >
                  {status.icon}
                  {equipment.status}
                </Badge>
              </div>
              
              {equipment.last_prediction && equipment.status !== 'HEALTHY' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Failure Risk</span>
                    <span className="font-medium">
                      {(equipment.last_prediction.failure_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={equipment.last_prediction.failure_probability * 100}
                    className={cn(
                      "h-1.5",
                      equipment.status === 'FAILURE' ? "[&>div]:bg-destructive" : "[&>div]:bg-warning"
                    )}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {equipment.last_prediction.time_to_failure}
                    </div>
                    <span className="text-muted-foreground">
                      {equipment.last_prediction.failure_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}