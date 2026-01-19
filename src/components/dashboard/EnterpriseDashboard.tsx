import React, { useEffect, useState } from 'react';
import { 
  Tractor, Droplets, Sun, AlertTriangle, CheckCircle2, 
  Clock, Package, Users, Wrench, TrendingUp, Activity,
  Bell, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Equipment, WorkOrder, Alert, SystemStats } from '@/types/enterprise';
import { cn } from '@/lib/utils';

export function EnterpriseDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    total_equipment: 0,
    operational_count: 0,
    warning_count: 0,
    critical_count: 0,
    active_work_orders: 0,
    low_stock_items: 0,
    available_technicians: 0,
    unacknowledged_alerts: 0,
  });
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch equipment
      const { data: eqData } = await supabase
        .from('equipment')
        .select('*, farms(name)')
        .order('status', { ascending: false });

      // Fetch work orders
      const { data: woData } = await supabase
        .from('work_orders')
        .select('*, equipment(equipment_code, name), technicians(first_name, last_name)')
        .in('status', ['pending', 'scheduled', 'in_progress'])
        .order('priority', { ascending: false })
        .limit(5);

      // Fetch alerts
      const { data: alertData } = await supabase
        .from('alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch technicians count
      const { data: techData } = await supabase
        .from('technicians')
        .select('id')
        .eq('status', 'available');

      // Fetch low stock count
      const { data: invData } = await supabase
        .from('inventory')
        .select('id, quantity_on_hand, reorder_point');

      if (eqData) {
        setEquipment(eqData as Equipment[]);
        const operational = eqData.filter(e => e.status === 'operational').length;
        const warning = eqData.filter(e => e.status === 'warning').length;
        const critical = eqData.filter(e => e.status === 'critical').length;

        setStats(prev => ({
          ...prev,
          total_equipment: eqData.length,
          operational_count: operational,
          warning_count: warning,
          critical_count: critical,
        }));
      }

      if (woData) {
        setWorkOrders(woData as WorkOrder[]);
        setStats(prev => ({ ...prev, active_work_orders: woData.length }));
      }

      if (alertData) {
        setAlerts(alertData as Alert[]);
        setStats(prev => ({ ...prev, unacknowledged_alerts: alertData.length }));
      }

      if (techData) {
        setStats(prev => ({ ...prev, available_technicians: techData.length }));
      }

      if (invData) {
        const lowStock = invData.filter(i => i.quantity_on_hand <= i.reorder_point).length;
        setStats(prev => ({ ...prev, low_stock_items: lowStock }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'tractor': return <Tractor className="w-5 h-5" />;
      case 'irrigation': return <Droplets className="w-5 h-5" />;
      case 'solar_pump': return <Sun className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-ok bg-ok/10';
      case 'warning': return 'text-warning bg-warning/10';
      case 'critical': return 'text-danger bg-danger/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-danger text-danger-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const healthPercentage = stats.total_equipment > 0 
    ? Math.round((stats.operational_count / stats.total_equipment) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-ok/10 to-ok/5 border-ok/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Operational</p>
                <p className="text-3xl font-bold text-ok">{stats.operational_count}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-ok/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-3xl font-bold text-warning">{stats.warning_count}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-warning/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-danger/10 to-danger/5 border-danger/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold text-danger">{stats.critical_count}</p>
              </div>
              <Activity className="w-10 h-10 text-danger/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Work Orders</p>
                <p className="text-3xl font-bold text-primary">{stats.active_work_orders}</p>
              </div>
              <Clock className="w-10 h-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Technicians</p>
                <p className="text-xl font-semibold">{stats.available_technicians}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-xl font-semibold">{stats.low_stock_items}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-xl font-semibold">{stats.unacknowledged_alerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Fleet Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overall Health</span>
              <span className="font-semibold text-lg">{healthPercentage}%</span>
            </div>
            <Progress value={healthPercentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-ok">{stats.operational_count}</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{stats.warning_count}</div>
                <div className="text-xs text-muted-foreground">Needs Attention</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-danger">{stats.critical_count}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Equipment Status
              </span>
              <Badge variant="outline">{equipment.length} units</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {equipment.slice(0, 5).map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getStatusColor(eq.status))}>
                      {getEquipmentIcon(eq.equipment_type)}
                    </div>
                    <div>
                      <p className="font-medium">{eq.equipment_code}</p>
                      <p className="text-xs text-muted-foreground">{eq.name}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(eq.status)} variant="outline">
                    {eq.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Active Work Orders
              </span>
              <Badge variant="outline">{workOrders.length} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active work orders</p>
              ) : (
                workOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(wo.priority)} variant="default">
                          {wo.priority}
                        </Badge>
                        <p className="font-mono text-sm">{wo.work_order_number}</p>
                      </div>
                      <p className="text-sm truncate mt-1">{wo.title}</p>
                      {wo.technicians && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned: {wo.technicians.first_name} {wo.technicians.last_name}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card className="border-danger/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <Bell className="w-5 h-5" />
              Unacknowledged Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    alert.severity === 'critical' ? 'bg-danger/10' : 
                    alert.severity === 'warning' ? 'bg-warning/10' : 'bg-muted/30'
                  )}
                >
                  <AlertTriangle className={cn(
                    'w-5 h-5 mt-0.5',
                    alert.severity === 'critical' ? 'text-danger' :
                    alert.severity === 'warning' ? 'text-warning' : 'text-muted-foreground'
                  )} />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
