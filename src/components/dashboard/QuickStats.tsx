import { Activity, Tractor, AlertTriangle, CheckCircle2, Wrench, Building2 } from 'lucide-react';
import { StatsCard } from './StatsCard';

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatsCard
        title="Total Predictions"
        value="1,247"
        subtitle="This month"
        icon={<Activity className="h-5 w-5" />}
        variant="primary"
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard
        title="Equipment"
        value="48"
        subtitle="Active units"
        icon={<Tractor className="h-5 w-5" />}
        variant="default"
      />
      <StatsCard
        title="Healthy"
        value="42"
        subtitle="87.5% uptime"
        icon={<CheckCircle2 className="h-5 w-5" />}
        variant="success"
      />
      <StatsCard
        title="Alerts"
        value="6"
        subtitle="Requiring attention"
        icon={<AlertTriangle className="h-5 w-5" />}
        variant="warning"
      />
      <StatsCard
        title="Work Orders"
        value="8"
        subtitle="Pending"
        icon={<Wrench className="h-5 w-5" />}
        variant="destructive"
      />
      <StatsCard
        title="Farms"
        value="12"
        subtitle="Connected"
        icon={<Building2 className="h-5 w-5" />}
        variant="default"
      />
    </div>
  );
}