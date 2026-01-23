import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface SensorConfig {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  step?: number;
}

interface SensorInputProps {
  sensor: SensorConfig;
  value: number;
  onChange: (key: string, value: number) => void;
  warning?: boolean;
  error?: boolean;
}

export function SensorInput({ sensor, value, onChange, warning, error }: SensorInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const percentage = ((value - sensor.min) / (sensor.max - sensor.min)) * 100;
  
  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all duration-200",
      error ? "border-destructive/50 bg-destructive/5" :
      warning ? "border-warning/50 bg-warning/5" :
      "border-border/50 bg-secondary/30 hover:bg-secondary/50"
    )}>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-medium">{sensor.label}</Label>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(sensor.key, parseFloat(e.target.value) || sensor.min)}
              onBlur={() => setIsEditing(false)}
              step={sensor.step || 1}
              min={sensor.min}
              max={sensor.max}
              className="w-20 h-8 text-right text-sm"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 rounded bg-secondary hover:bg-muted transition-colors"
            >
              <span className="text-lg font-semibold tabular-nums">{value.toFixed(sensor.step && sensor.step < 1 ? 1 : 0)}</span>
              <span className="text-xs text-muted-foreground ml-1">{sensor.unit}</span>
            </button>
          )}
        </div>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(sensor.key, v)}
        min={sensor.min}
        max={sensor.max}
        step={sensor.step || 1}
        className="mt-1"
      />
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{sensor.min} {sensor.unit}</span>
        <span>{sensor.max} {sensor.unit}</span>
      </div>
      
      {/* Visual indicator bar */}
      <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300",
            error ? "bg-destructive" :
            warning ? "bg-warning" :
            "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}