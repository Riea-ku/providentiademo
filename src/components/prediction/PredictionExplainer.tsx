import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Wrench, Clock, HelpCircle } from 'lucide-react';
import { PredictionResult as PredictionResultType, EquipmentType, SensorData, EQUIPMENT_CONFIG } from '@/types/equipment';
import { cn } from '@/lib/utils';

interface PredictionExplainerProps {
  result: PredictionResultType;
  equipmentType: EquipmentType;
  sensorData: SensorData;
}

export function PredictionExplainer({ result, equipmentType, sensorData }: PredictionExplainerProps) {
  const config = EQUIPMENT_CONFIG[equipmentType];
  
  // Get status symbol
  const getStatusSymbol = () => {
    if (result.prediction === 'HEALTHY') return '[*]';
    if (result.prediction === 'WARNING') return '[!]';
    return '[X]';
  };
  
  // Get urgency text
  const getUrgencyText = () => {
    switch (result.maintenance_urgency) {
      case 'critical': return 'CRITICAL - Act Now';
      case 'high': return 'HIGH - Schedule Within 3 Days';
      case 'medium': return 'MEDIUM - Schedule Within 2 Weeks';
      default: return 'LOW - Routine Maintenance';
    }
  };
  
  // Explain each failure in plain language
  const explainFailure = (failure: any) => {
    const explanations: Record<string, { cause: string; impact: string; action: string }> = {
      'HIGH': {
        cause: 'Sensor reading is significantly above the safe operating range',
        impact: 'Continued operation may cause permanent damage to components',
        action: 'Stop operation and schedule immediate inspection'
      },
      'LOW': {
        cause: 'Sensor reading is below the minimum required level',
        impact: 'Equipment efficiency is reduced and may fail to perform correctly',
        action: 'Check for leaks, blockages, or worn components'
      }
    };
    
    return explanations[failure.issue] || {
      cause: 'Abnormal sensor reading detected',
      impact: 'Equipment performance may be affected',
      action: 'Schedule maintenance inspection'
    };
  };
  
  // Get cost comparison
  const getCostComparison = () => {
    const preventive = result.cost_estimate?.total_cost || 0;
    const emergency = preventive * 2.5;
    const savings = emergency - preventive;
    
    return { preventive, emergency, savings };
  };
  
  const costs = getCostComparison();
  
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-primary" />
          Plain Language Explanation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Status */}
        <div className="p-4 rounded-lg bg-card border">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-xl",
              result.prediction === 'HEALTHY' ? "bg-success/20 text-success" :
              result.prediction === 'WARNING' ? "bg-warning/20 text-warning" :
              "bg-destructive/20 text-destructive"
            )}>
              {result.prediction === 'HEALTHY' ? <CheckCircle2 className="h-6 w-6" /> :
               result.prediction === 'WARNING' ? <AlertTriangle className="h-6 w-6" /> :
               <XCircle className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {getStatusSymbol()} {result.prediction === 'HEALTHY' ? 'Equipment is Operating Normally' :
                result.prediction === 'WARNING' ? 'Equipment Needs Attention' :
                'Critical Issues Detected'}
              </p>
              <p className="text-muted-foreground mt-1">
                Health Score: <span className="font-semibold">{(result.confidence * 100).toFixed(0)}%</span>
              </p>
            </div>
            <Badge variant={result.prediction === 'HEALTHY' ? 'secondary' : 'destructive'}>
              {getUrgencyText()}
            </Badge>
          </div>
        </div>
        
        {/* What's Wrong Section */}
        {result.detected_failures.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              What's Wrong
            </h4>
            <div className="space-y-4">
              {result.detected_failures.map((failure, idx) => {
                const explanation = explainFailure(failure);
                return (
                  <div key={idx} className={cn(
                    "p-4 rounded-lg border-l-4",
                    failure.issue === 'HIGH' ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5"
                  )}>
                    <p className="font-medium">
                      {failure.issue === 'HIGH' ? '[X]' : '[!]'} {failure.message}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p><span className="font-medium">Why:</span> {explanation.cause}</p>
                      <p><span className="font-medium">Impact:</span> {explanation.impact}</p>
                      <p><span className="font-medium">Action:</span> {explanation.action}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Normal range: {failure.normal_range}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Time to Failure */}
        {result.prediction !== 'HEALTHY' && (
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Estimated Time to Failure</p>
                <p className="text-2xl font-bold text-primary">{result.time_to_failure}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              If you don't address these issues, the equipment may fail within this timeframe.
            </p>
          </div>
        )}
        
        {/* Cost Comparison */}
        {result.prediction !== 'HEALTHY' && (
          <div className="space-y-3">
            <h4 className="font-semibold">Cost Comparison</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                <p className="text-xs text-muted-foreground">Fix Now</p>
                <p className="text-xl font-bold text-success">${costs.preventive.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-xs text-muted-foreground">Emergency Repair</p>
                <p className="text-xl font-bold text-destructive">${costs.emergency.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground">You Save</p>
                <p className="text-xl font-bold text-primary">${costs.savings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Recommended Actions */}
        <div className="space-y-3">
          <h4 className="font-semibold">What You Should Do</h4>
          <div className="space-y-2">
            {result.prediction === 'HEALTHY' ? (
              <>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-success">[*]</span> Continue regular operations
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-primary">[&gt;]</span> Schedule routine maintenance as planned
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-muted-foreground">[i]</span> Keep monitoring sensor readings
                </p>
              </>
            ) : result.prediction === 'WARNING' ? (
              <>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-warning">[!]</span> Schedule maintenance within the next week
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-primary">[&gt;]</span> Order any replacement parts now
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-muted-foreground">[i]</span> Monitor equipment more frequently until serviced
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-destructive">[X]</span> Stop using the equipment if possible
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-destructive">[!]</span> Schedule emergency maintenance TODAY
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-primary">[&gt;]</span> Check parts availability immediately
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-muted-foreground">[i]</span> Continued use risks complete breakdown
                </p>
              </>
            )}
          </div>
        </div>
        
        {/* Impact Message */}
        <div className="p-4 rounded-lg bg-muted/30 border text-sm">
          <p className="font-medium mb-1">[i] Bottom Line:</p>
          <p className="text-muted-foreground">{result.impact_message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
