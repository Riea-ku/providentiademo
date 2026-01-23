import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'primary';
}

const variantStyles = {
  default: 'from-secondary/80 to-secondary/40',
  success: 'from-success/20 to-success/5',
  warning: 'from-warning/20 to-warning/5',
  destructive: 'from-destructive/20 to-destructive/5',
  primary: 'from-primary/20 to-primary/5',
};

const iconStyles = {
  default: 'bg-secondary text-muted-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  destructive: 'bg-destructive/20 text-destructive',
  primary: 'bg-primary/20 text-primary',
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  variant = 'default' 
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden p-6 animate-fade-in",
      "bg-gradient-to-br",
      variantStyles[variant],
      "border-border/50 hover:border-border transition-colors"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          iconStyles[variant]
        )}>
          {icon}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
    </Card>
  );
}