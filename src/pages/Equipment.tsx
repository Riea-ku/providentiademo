import { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Plus, 
  Tractor, 
  Droplets, 
  Sun,
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Wrench,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EquipmentItem {
  id: string;
  name: string;
  type: 'solar_water_pump' | 'irrigation_system' | 'tractor_engine';
  farm: string;
  status: 'HEALTHY' | 'WARNING' | 'FAILURE';
  lastPrediction: string;
  failureRisk: number;
  timeToFailure?: string;
  operatingHours: number;
}

const mockEquipment: EquipmentItem[] = [
  { id: 'SWP-001', name: 'Solar Pump Station A', type: 'solar_water_pump', farm: 'North Field Farm', status: 'HEALTHY', lastPrediction: '5 min ago', failureRisk: 8, operatingHours: 1520 },
  { id: 'SWP-002', name: 'Solar Pump Station B', type: 'solar_water_pump', farm: 'South Valley Farm', status: 'HEALTHY', lastPrediction: '1 hr ago', failureRisk: 12, operatingHours: 2100 },
  { id: 'IRR-001', name: 'Main Irrigation Grid', type: 'irrigation_system', farm: 'North Field Farm', status: 'WARNING', lastPrediction: '15 min ago', failureRisk: 45, timeToFailure: '11-21 days', operatingHours: 3200 },
  { id: 'TRC-001', name: 'John Deere 6M', type: 'tractor_engine', farm: 'North Field Farm', status: 'FAILURE', lastPrediction: '30 min ago', failureRisk: 85, timeToFailure: '1-2 days', operatingHours: 4580 },
  { id: 'IRR-002', name: 'South Field Drip System', type: 'irrigation_system', farm: 'South Valley Farm', status: 'HEALTHY', lastPrediction: '2 hrs ago', failureRisk: 15, operatingHours: 1800 },
  { id: 'TRC-002', name: 'Case IH Magnum', type: 'tractor_engine', farm: 'East Ridge Farm', status: 'HEALTHY', lastPrediction: '3 hrs ago', failureRisk: 10, operatingHours: 2200 },
  { id: 'SWP-003', name: 'Solar Pump Station C', type: 'solar_water_pump', farm: 'East Ridge Farm', status: 'WARNING', lastPrediction: '45 min ago', failureRisk: 38, timeToFailure: '8-14 days', operatingHours: 2800 },
  { id: 'IRR-003', name: 'Greenhouse Mist System', type: 'irrigation_system', farm: 'Central Hub', status: 'HEALTHY', lastPrediction: '4 hrs ago', failureRisk: 5, operatingHours: 950 },
];

const typeIcons = {
  solar_water_pump: <Sun className="h-5 w-5" />,
  irrigation_system: <Droplets className="h-5 w-5" />,
  tractor_engine: <Tractor className="h-5 w-5" />,
};

const typeLabels = {
  solar_water_pump: 'Solar Water Pump',
  irrigation_system: 'Irrigation System',
  tractor_engine: 'Tractor Engine',
};

const statusConfig = {
  HEALTHY: { icon: <CheckCircle2 className="h-4 w-4" />, className: 'text-success', bg: 'bg-success/10' },
  WARNING: { icon: <AlertTriangle className="h-4 w-4" />, className: 'text-warning', bg: 'bg-warning/10' },
  FAILURE: { icon: <XCircle className="h-4 w-4" />, className: 'text-destructive', bg: 'bg-destructive/10' },
};

const EquipmentPage = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'HEALTHY' | 'WARNING' | 'FAILURE'>('ALL');
  
  const filtered = mockEquipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
                         eq.id.toLowerCase().includes(search.toLowerCase()) ||
                         eq.farm.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || eq.status === filter;
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-x-hidden">
        <Header alertCount={6} />
        
        <div className="container py-6 px-4 md:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Equipment</h1>
              <p className="text-muted-foreground">Manage and monitor all agricultural equipment</p>
            </div>
            <Button className="gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Add Equipment
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'HEALTHY', 'WARNING', 'FAILURE'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className={cn(
                    filter === status && status === 'HEALTHY' && "text-success",
                    filter === status && status === 'WARNING' && "text-warning",
                    filter === status && status === 'FAILURE' && "text-destructive"
                  )}
                >
                  {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Equipment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((equipment) => {
              const status = statusConfig[equipment.status];
              
              return (
                <Card 
                  key={equipment.id}
                  className={cn(
                    "border-border/50 hover:border-primary/30 transition-all cursor-pointer",
                    equipment.status === 'FAILURE' && "border-destructive/30",
                    equipment.status === 'WARNING' && "border-warning/30"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          status.bg, status.className
                        )}>
                          {typeIcons[equipment.type]}
                        </div>
                        <div>
                          <CardTitle className="text-base">{equipment.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{equipment.id}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Run Prediction</DropdownMenuItem>
                          <DropdownMenuItem>Create Work Order</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{typeLabels[equipment.type]}</span>
                      <Badge 
                        variant="outline"
                        className={cn("gap-1", status.className)}
                      >
                        {status.icon}
                        {equipment.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failure Risk</span>
                        <span className="font-medium">{equipment.failureRisk}%</span>
                      </div>
                      <Progress 
                        value={equipment.failureRisk}
                        className={cn(
                          "h-1.5",
                          equipment.failureRisk > 60 ? "[&>div]:bg-destructive" :
                          equipment.failureRisk > 30 ? "[&>div]:bg-warning" :
                          "[&>div]:bg-success"
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{equipment.farm}</span>
                      <span>{equipment.operatingHours.toLocaleString()} hrs</span>
                    </div>
                    
                    {equipment.timeToFailure && (
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded text-xs",
                        equipment.status === 'FAILURE' ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                      )}>
                        <Clock className="h-3 w-3" />
                        Time to failure: {equipment.timeToFailure}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Wrench className="h-3 w-3 mr-1" />
                        Maintain
                      </Button>
                      <Button size="sm" className="flex-1 text-xs">
                        Predict
                      </Button>
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

export default EquipmentPage;