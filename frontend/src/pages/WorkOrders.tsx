import { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Wrench, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Status = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface WorkOrder {
  id: string;
  equipment: string;
  equipmentId: string;
  priority: Priority;
  status: Status;
  failureType: string;
  description: string;
  estimatedCost: number;
  assignee?: string;
  createdAt: Date;
  scheduledFor?: Date;
}

const mockWorkOrders: WorkOrder[] = [
  { id: 'WO-001', equipment: 'John Deere 6M', equipmentId: 'TRC-001', priority: 'critical', status: 'pending', failureType: 'Overheating', description: 'Cooling system repair needed', estimatedCost: 510, createdAt: new Date(Date.now() - 1000 * 60 * 30), scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  { id: 'WO-002', equipment: 'Main Irrigation Grid', equipmentId: 'IRR-001', priority: 'medium', status: 'in_progress', failureType: 'Efficiency Loss', description: 'System optimization required', estimatedCost: 270, assignee: 'Mike Johnson', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: 'WO-003', equipment: 'Solar Pump Station C', equipmentId: 'SWP-003', priority: 'high', status: 'pending', failureType: 'Bearing Failure', description: 'Bearing replacement', estimatedCost: 265, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 48) },
  { id: 'WO-004', equipment: 'Solar Pump Station A', equipmentId: 'SWP-001', priority: 'low', status: 'completed', failureType: 'Filter Clogged', description: 'Routine filter cleaning', estimatedCost: 120, assignee: 'Sarah Davis', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: 'WO-005', equipment: 'South Field Drip System', equipmentId: 'IRR-002', priority: 'medium', status: 'pending', failureType: 'Pressure Loss', description: 'Line pressure restoration', estimatedCost: 300, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) },
  { id: 'WO-006', equipment: 'Case IH Magnum', equipmentId: 'TRC-002', priority: 'low', status: 'completed', failureType: 'General Maintenance', description: 'Scheduled maintenance', estimatedCost: 175, assignee: 'Tom Wilson', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
];

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-success/20 text-success border-success/30' },
  medium: { label: 'Medium', className: 'bg-warning/20 text-warning border-warning/30' },
  high: { label: 'High', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  critical: { label: 'Critical', className: 'bg-destructive text-destructive-foreground' },
};

const statusConfig: Record<Status, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: 'Pending', icon: <Clock className="h-3 w-3" />, className: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: <Wrench className="h-3 w-3" />, className: 'text-primary' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" />, className: 'text-success' },
  cancelled: { label: 'Cancelled', icon: <AlertCircle className="h-3 w-3" />, className: 'text-muted-foreground' },
};

const WorkOrdersPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  
  const filtered = mockWorkOrders.filter(wo => {
    const matchesSearch = wo.equipment.toLowerCase().includes(search.toLowerCase()) ||
                         wo.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const pendingCount = mockWorkOrders.filter(wo => wo.status === 'pending').length;
  const inProgressCount = mockWorkOrders.filter(wo => wo.status === 'in_progress').length;
  const totalEstimatedCost = mockWorkOrders.filter(wo => wo.status !== 'completed').reduce((acc, wo) => acc + wo.estimatedCost, 0);
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-x-hidden">
        <Header alertCount={6} />
        
        <div className="container py-6 px-4 md:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Work Orders</h1>
              <p className="text-muted-foreground">Manage maintenance and repair tasks</p>
            </div>
            <Button className="gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Create Work Order
            </Button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-gradient-to-br from-warning/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{inProgressCount}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-destructive/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{mockWorkOrders.filter(wo => wo.priority === 'critical').length}</p>
                    <p className="text-xs text-muted-foreground">Critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-gold/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-gold" />
                  <div>
                    <p className="text-2xl font-bold">${totalEstimatedCost.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : statusConfig[status].label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Work Orders List */}
          <div className="space-y-3">
            {filtered.map((wo) => {
              const priority = priorityConfig[wo.priority];
              const status = statusConfig[wo.status];
              
              return (
                <Card 
                  key={wo.id}
                  className={cn(
                    "border-border/50 hover:border-primary/30 transition-all cursor-pointer",
                    wo.priority === 'critical' && wo.status === 'pending' && "border-l-4 border-l-destructive"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-lg flex items-center justify-center",
                          wo.priority === 'critical' ? "bg-destructive/20" : "bg-secondary"
                        )}>
                          <Wrench className={cn(
                            "h-6 w-6",
                            wo.priority === 'critical' ? "text-destructive" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{wo.id}</span>
                            <Badge variant="outline" className={priority.className}>
                              {priority.label}
                            </Badge>
                            <Badge variant="outline" className={cn("gap-1", status.className)}>
                              {status.icon}
                              {status.label}
                            </Badge>
                          </div>
                          <p className="font-medium">{wo.equipment}</p>
                          <p className="text-sm text-muted-foreground">{wo.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          ${wo.estimatedCost}
                        </div>
                        {wo.assignee && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            {wo.assignee}
                          </div>
                        )}
                        {wo.scheduledFor && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {wo.scheduledFor.toLocaleDateString()}
                          </div>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkOrdersPage;