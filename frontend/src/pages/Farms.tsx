import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  MapPin, 
  Tractor, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  Plus,
  Users,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Farm {
  id: string;
  name: string;
  location: string;
  equipmentCount: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  workers: number;
  area: string;
  lastActivity: string;
}

const mockFarms: Farm[] = [
  { id: 'farm_001', name: 'North Field Farm', location: 'Riverside County, CA', equipmentCount: 12, healthyCount: 9, warningCount: 2, criticalCount: 1, workers: 8, area: '450 acres', lastActivity: '5 min ago' },
  { id: 'farm_002', name: 'South Valley Farm', location: 'Fresno County, CA', equipmentCount: 8, healthyCount: 7, warningCount: 1, criticalCount: 0, workers: 5, area: '320 acres', lastActivity: '30 min ago' },
  { id: 'farm_003', name: 'East Ridge Farm', location: 'Tulare County, CA', equipmentCount: 15, healthyCount: 12, warningCount: 2, criticalCount: 1, workers: 12, area: '680 acres', lastActivity: '1 hr ago' },
  { id: 'farm_004', name: 'Central Hub', location: 'Kings County, CA', equipmentCount: 6, healthyCount: 6, warningCount: 0, criticalCount: 0, workers: 4, area: '200 acres', lastActivity: '2 hrs ago' },
  { id: 'farm_005', name: 'West Orchard', location: 'Kern County, CA', equipmentCount: 10, healthyCount: 8, warningCount: 1, criticalCount: 1, workers: 7, area: '420 acres', lastActivity: '3 hrs ago' },
];

const FarmsPage = () => {
  const totalEquipment = mockFarms.reduce((acc, f) => acc + f.equipmentCount, 0);
  const totalHealthy = mockFarms.reduce((acc, f) => acc + f.healthyCount, 0);
  const totalWarning = mockFarms.reduce((acc, f) => acc + f.warningCount, 0);
  const totalCritical = mockFarms.reduce((acc, f) => acc + f.criticalCount, 0);
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-x-hidden">
        <Header alertCount={6} />
        
        <div className="container py-6 px-4 md:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Farms</h1>
              <p className="text-muted-foreground">Monitor and manage your farm locations</p>
            </div>
            <Button className="gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Add Farm
            </Button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{mockFarms.length}</p>
                    <p className="text-xs text-muted-foreground">Total Farms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-secondary to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Tractor className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{totalEquipment}</p>
                    <p className="text-xs text-muted-foreground">Equipment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-success/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{totalHealthy}</p>
                    <p className="text-xs text-muted-foreground">Healthy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-destructive/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{totalWarning + totalCritical}</p>
                    <p className="text-xs text-muted-foreground">Need Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Farms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockFarms.map((farm) => {
              const healthPercentage = (farm.healthyCount / farm.equipmentCount) * 100;
              const hasIssues = farm.warningCount > 0 || farm.criticalCount > 0;
              
              return (
                <Card 
                  key={farm.id}
                  className={cn(
                    "border-border/50 hover:border-primary/30 transition-all cursor-pointer",
                    farm.criticalCount > 0 && "border-l-4 border-l-destructive"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{farm.name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {farm.location}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Equipment Status */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Tractor className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{farm.equipmentCount}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        {farm.healthyCount > 0 && (
                          <Badge variant="outline" className="text-success border-success/30 text-xs">
                            {farm.healthyCount} healthy
                          </Badge>
                        )}
                        {farm.warningCount > 0 && (
                          <Badge variant="outline" className="text-warning border-warning/30 text-xs">
                            {farm.warningCount} warning
                          </Badge>
                        )}
                        {farm.criticalCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {farm.criticalCount} critical
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Health Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Equipment Health</span>
                        <span className="font-medium">{healthPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={healthPercentage}
                        className={cn(
                          "h-2",
                          healthPercentage < 70 ? "[&>div]:bg-destructive" :
                          healthPercentage < 90 ? "[&>div]:bg-warning" :
                          "[&>div]:bg-success"
                        )}
                      />
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center justify-between text-sm border-t border-border/30 pt-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {farm.workers} workers
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        {farm.area}
                      </div>
                      <span className="text-xs text-muted-foreground">{farm.lastActivity}</span>
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

export default FarmsPage;