import { Activity, Database, Cpu, Wifi, Cloud, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SystemModule {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  icon: React.ReactNode;
  detail: string;
}

const modules: SystemModule[] = [
  { name: 'ML Predictions', status: 'online', icon: <Cpu className="h-4 w-4" />, detail: 'Ready' },
  { name: 'Farm Management', status: 'online', icon: <Database className="h-4 w-4" />, detail: '12 farms' },
  { name: 'Workflows', status: 'online', icon: <Activity className="h-4 w-4" />, detail: '3 active' },
  { name: 'Inventory', status: 'online', icon: <Cloud className="h-4 w-4" />, detail: '156 parts' },
  { name: 'IoT Sensors', status: 'online', icon: <Wifi className="h-4 w-4" />, detail: 'Connected' },
  { name: 'Real-time Stream', status: 'online', icon: <Zap className="h-4 w-4" />, detail: 'Active' },
];

const statusColors = {
  online: 'bg-success',
  offline: 'bg-destructive',
  degraded: 'bg-warning',
};

const statusBg = {
  online: 'from-success/10 to-success/5',
  offline: 'from-destructive/10 to-destructive/5',
  degraded: 'from-warning/10 to-warning/5',
};

export function SystemStatus() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Integrated Systems Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {modules.map((module) => (
            <div
              key={module.name}
              className={cn(
                "relative p-3 rounded-lg bg-gradient-to-br border border-border/30",
                statusBg[module.status]
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  statusColors[module.status]
                )} />
                <span className="text-xs font-medium text-muted-foreground">
                  {module.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-muted-foreground">{module.icon}</div>
                <span className="text-sm font-semibold truncate">{module.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{module.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}