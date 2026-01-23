import { Clock, TrendingUp, Wrench, AlertCircle, CheckCircle, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'prediction' | 'maintenance' | 'alert' | 'token' | 'completed';
  title: string;
  description: string;
  timestamp: Date;
  equipment?: string;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'prediction',
    title: 'Prediction Generated',
    description: 'Solar Pump Station A analyzed - HEALTHY status',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    equipment: 'Solar Pump Station A',
  },
  {
    id: '2',
    type: 'alert',
    title: 'High Temperature Alert',
    description: 'John Deere 6M oil temperature exceeded threshold',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    equipment: 'John Deere 6M',
  },
  {
    id: '3',
    type: 'maintenance',
    title: 'Work Order Created',
    description: 'Cooling system repair scheduled for Tractor Engine',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    equipment: 'John Deere 6M',
  },
  {
    id: '4',
    type: 'token',
    title: 'Tokens Earned',
    description: 'farm_001 earned 5 tokens for prediction submission',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: '5',
    type: 'completed',
    title: 'Maintenance Completed',
    description: 'Filter replacement finished for Main Irrigation Grid',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    equipment: 'Main Irrigation Grid',
  },
  {
    id: '6',
    type: 'prediction',
    title: 'Prediction Generated',
    description: 'Irrigation System analyzed - WARNING status',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    equipment: 'Main Irrigation Grid',
  },
];

const typeConfig = {
  prediction: {
    icon: <TrendingUp className="h-4 w-4" />,
    className: 'bg-primary/20 text-primary',
  },
  maintenance: {
    icon: <Wrench className="h-4 w-4" />,
    className: 'bg-warning/20 text-warning',
  },
  alert: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'bg-destructive/20 text-destructive',
  },
  token: {
    icon: <Coins className="h-4 w-4" />,
    className: 'bg-gold/20 text-gold',
  },
  completed: {
    icon: <CheckCircle className="h-4 w-4" />,
    className: 'bg-success/20 text-success',
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function RecentActivity() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Last updated: {formatRelativeTime(new Date())}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivity.map((activity, index) => {
            const config = typeConfig[activity.type];
            
            return (
              <div 
                key={activity.id} 
                className={cn(
                  "relative flex gap-4 pb-4",
                  index !== mockActivity.length - 1 && "border-b border-border/30"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  config.className
                )}>
                  {config.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}