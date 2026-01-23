import { AlertTriangle, CheckCircle2, Clock, DollarSign, Wrench, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PredictionResult as PredictionResultType, HealthStatus, MaintenanceUrgency } from '@/types/equipment';

interface PredictionResultProps {
  result: PredictionResultType | null;
  isLoading?: boolean;
  onGenerateQuote?: () => void;
}

const statusConfig: Record<HealthStatus, { icon: React.ReactNode; label: string; className: string; bgClass: string }> = {
  HEALTHY: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    label: 'HEALTHY',
    className: 'text-success',
    bgClass: 'from-success/20 via-success/10 to-card',
  },
  WARNING: {
    icon: <AlertTriangle className="h-6 w-6" />,
    label: 'WARNING',
    className: 'text-warning',
    bgClass: 'from-warning/20 via-warning/10 to-card',
  },
  FAILURE: {
    icon: <XCircle className="h-6 w-6" />,
    label: 'FAILURE RISK',
    className: 'text-destructive',
    bgClass: 'from-destructive/20 via-destructive/10 to-card',
  },
};

const urgencyColors: Record<MaintenanceUrgency, string> = {
  low: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  critical: 'bg-destructive text-destructive-foreground border-destructive',
};

export function PredictionResultCard({ result, isLoading, onGenerateQuote }: PredictionResultProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50 overflow-hidden">
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground animate-pulse">Analyzing sensor data...</p>
        </div>
      </Card>
    );
  }
  
  if (!result) {
    return (
      <Card className="border-border/50 border-dashed">
        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <Wrench className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Ready for Prediction</h3>
            <p className="text-sm text-muted-foreground">
              Adjust sensor values and click "Run Prediction" to analyze equipment health.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  
  const status = statusConfig[result.prediction];
  
  return (
    <Card className={cn(
      "border-border/50 overflow-hidden transition-all duration-500",
      "bg-gradient-to-br",
      status.bgClass
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Prediction Result</CardTitle>
          <Badge 
            variant="outline" 
            className={cn("font-semibold", urgencyColors[result.maintenance_urgency])}
          >
            {result.maintenance_urgency.toUpperCase()} URGENCY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Status */}
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl bg-card/50", status.className)}>
            {status.icon}
          </div>
          <div>
            <p className={cn("text-2xl font-bold", status.className)}>
              {status.label}
            </p>
            <p className="text-sm text-muted-foreground">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        
        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Failure Probability</span>
            <span className="font-medium">{(result.failure_probability * 100).toFixed(1)}%</span>
          </div>
          <Progress 
            value={result.failure_probability * 100} 
            className={cn(
              "h-2",
              result.failure_probability > 0.7 ? "[&>div]:bg-destructive" :
              result.failure_probability > 0.4 ? "[&>div]:bg-warning" :
              "[&>div]:bg-success"
            )}
          />
        </div>
        
        {/* Time to Failure */}
        {result.prediction !== 'HEALTHY' && (
          <div className={cn(
            "p-4 rounded-lg border",
            result.maintenance_urgency === 'critical' ? "status-critical" :
            result.maintenance_urgency === 'high' ? "status-warning" :
            "status-healthy"
          )}>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Estimated Time to Failure</p>
                <p className="text-lg font-bold">{result.time_to_failure}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Failure Type */}
        {result.failure_type !== 'no_failure' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Detected Issue</p>
            <Badge variant="secondary" className="text-sm">
              {result.failure_type.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        )}
        
        {/* Impact Message */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {result.impact_message}
        </p>
        
        {/* Cost Estimate */}
        {result.cost_estimate && (
          <div className="p-4 rounded-lg bg-card/50 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-gold" />
              <span className="font-semibold">Maintenance Cost Estimate</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Labor</p>
                <p className="font-semibold">{result.cost_estimate.labor_hours}h × $45</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parts</p>
                <p className="font-semibold">${result.cost_estimate.parts_cost}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-bold text-lg text-primary">${result.cost_estimate.total_cost}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{result.cost_estimate.description}</p>
          </div>
        )}
        
        {/* Detected Failures List */}
        {result.detected_failures.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Detected Issues</p>
            <div className="space-y-2">
              {result.detected_failures.map((failure, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    failure.issue === 'HIGH' ? "status-critical" : "status-warning"
                  )}
                >
                  <p className="text-sm font-medium">{failure.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Normal range: {failure.normal_range}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        {result.prediction !== 'HEALTHY' && (
          <div className="flex gap-3 pt-2">
            <Button onClick={onGenerateQuote} className="flex-1">
              Generate Maintenance Quote
            </Button>
            <Button variant="outline" className="flex-1">
              Schedule Maintenance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}