import { useState, useCallback } from 'react';
import { Play, RotateCcw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EquipmentSelector } from './EquipmentSelector';
import { SensorInput } from './SensorInput';
import { PredictionResultCard } from './PredictionResult';
import { runPrediction } from '@/lib/prediction-engine';
import { EquipmentType, SensorData, PredictionResult, EQUIPMENT_CONFIG } from '@/types/equipment';
import { toast } from 'sonner';

// Example presets for testing
const FAILURE_PRESETS: Record<EquipmentType, Partial<SensorData>> = {
  solar_water_pump: {
    flow_rate_lmin: 35,
    pressure_bar: 1.5,
    vibration_mms: 12,
    bearing_temperature_c: 98,
    operating_hours: 3500,
  },
  irrigation_system: {
    pressure_bar: 2.0,
    flow_rate_lmin: 60,
    filter_pressure_drop: 1.8,
    system_efficiency: 0.55,
  },
  tractor_engine: {
    engine_rpm: 2400,
    oil_temperature_c: 115,
    coolant_temperature_c: 102,
    engine_load_percent: 92,
  },
};

export function PredictionPanel() {
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('solar_water_pump');
  const [farmerId, setFarmerId] = useState('farm_001');
  const [sensorData, setSensorData] = useState<SensorData>(() => getDefaultSensorData('solar_water_pump'));
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  function getDefaultSensorData(type: EquipmentType): SensorData {
    const config = EQUIPMENT_CONFIG[type];
    const data: SensorData = {};
    for (const sensor of config.sensors) {
      (data as Record<string, number>)[sensor.key] = sensor.default;
    }
    return data;
  }
  
  const handleEquipmentChange = useCallback((type: EquipmentType) => {
    setEquipmentType(type);
    setSensorData(getDefaultSensorData(type));
    setResult(null);
  }, []);
  
  const handleSensorChange = useCallback((key: string, value: number) => {
    setSensorData(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const handlePredict = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const prediction = runPrediction(sensorData, equipmentType);
    setResult(prediction);
    setIsLoading(false);
    
    if (prediction.prediction === 'HEALTHY') {
      toast.success('Equipment is healthy!', {
        description: 'All sensors are within normal operating range.',
      });
    } else if (prediction.prediction === 'WARNING') {
      toast.warning('Warning detected', {
        description: `${prediction.detected_failures.length} issue(s) found. Review recommended.`,
      });
    } else {
      toast.error('Failure risk detected!', {
        description: `Urgency: ${prediction.maintenance_urgency.toUpperCase()}. Immediate attention required.`,
      });
    }
  }, [sensorData, equipmentType]);
  
  const handleReset = useCallback(() => {
    setSensorData(getDefaultSensorData(equipmentType));
    setResult(null);
    toast.info('Sensors reset to default values');
  }, [equipmentType]);
  
  const handleLoadExample = useCallback(() => {
    setSensorData(prev => ({
      ...prev,
      ...FAILURE_PRESETS[equipmentType],
    }));
    setResult(null);
    toast.info('Loaded failure example', {
      description: 'Sensor values set to simulate equipment failure.',
    });
  }, [equipmentType]);
  
  const config = EQUIPMENT_CONFIG[equipmentType];
  
  // Determine which sensors have warnings/errors
  const thresholds = config.thresholds as Record<string, { low?: number; high?: number }>;
  const sensorStates = config.sensors.map(sensor => {
    const value = (sensorData as Record<string, number>)[sensor.key];
    const threshold = thresholds[sensor.key];
    if (!threshold) return { warning: false, error: false };
    
    const isLow = threshold.low !== undefined && value < threshold.low;
    const isHigh = threshold.high !== undefined && value > threshold.high;
    const isError = (threshold.low !== undefined && value < threshold.low * 0.8) ||
                   (threshold.high !== undefined && value > threshold.high * 1.2);
    
    return {
      warning: (isLow || isHigh) && !isError,
      error: isError,
    };
  });
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Equipment Prediction</CardTitle>
            <div className="text-xs text-muted-foreground">
              Model: <span className="font-semibold text-primary">RandomForest v2.1</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Equipment Selection */}
          <EquipmentSelector 
            selected={equipmentType} 
            onSelect={handleEquipmentChange} 
          />
          
          {/* Sensor Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Sensor Readings</h3>
              <span className="text-xs text-muted-foreground">
                {config.sensors.length} sensors • {config.icon} {config.name}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.sensors.map((sensor, idx) => (
                <SensorInput
                  key={sensor.key}
                  sensor={sensor}
                  value={(sensorData as Record<string, number>)[sensor.key] ?? sensor.default}
                  onChange={handleSensorChange}
                  warning={sensorStates[idx].warning}
                  error={sensorStates[idx].error}
                />
              ))}
            </div>
          </div>
          
          {/* Farmer ID */}
          <div className="space-y-2">
            <Label htmlFor="farmer_id">Farmer ID</Label>
            <Input
              id="farmer_id"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              placeholder="farm_001"
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">
              Farmer ID is saved locally for convenience.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handlePredict} 
              className="flex-1 gap-2"
              disabled={isLoading}
            >
              <Play className="h-4 w-4" />
              Run Prediction
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLoadExample}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Load Example
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Result Panel */}
      <PredictionResultCard 
        result={result} 
        isLoading={isLoading}
        onGenerateQuote={() => toast.info('Quote generation coming soon!')}
      />
    </div>
  );
}