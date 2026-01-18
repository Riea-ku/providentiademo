import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/Sidebar';
import { PredictionPanel } from '@/components/prediction/PredictionPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Target, Zap } from 'lucide-react';

const recentPredictions = [
  { id: 1, equipment: 'Solar Pump A', status: 'HEALTHY', confidence: 94, time: '5 min ago' },
  { id: 2, equipment: 'Irrigation Grid', status: 'WARNING', confidence: 78, time: '15 min ago' },
  { id: 3, equipment: 'John Deere 6M', status: 'FAILURE', confidence: 92, time: '30 min ago' },
  { id: 4, equipment: 'Solar Pump B', status: 'HEALTHY', confidence: 96, time: '1 hr ago' },
  { id: 5, equipment: 'Drip System', status: 'HEALTHY', confidence: 89, time: '2 hrs ago' },
];

const PredictionsPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-x-hidden">
        <Header alertCount={6} />
        
        <div className="container py-6 px-4 md:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Predictions</h1>
              <p className="text-muted-foreground">Run predictive maintenance analysis on your equipment</p>
            </div>
            <div className="flex gap-3">
              <Card className="px-4 py-2 border-border/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Today</p>
                    <p className="font-semibold">72 predictions</p>
                  </div>
                </div>
              </Card>
              <Card className="px-4 py-2 border-border/50">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="font-semibold">94.2%</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Main Prediction Panel */}
          <PredictionPanel />
          
          {/* Recent Predictions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPredictions.map((pred) => (
                  <div 
                    key={pred.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{pred.equipment}</p>
                        <p className="text-xs text-muted-foreground">{pred.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="font-semibold">{pred.confidence}%</p>
                      </div>
                      <Badge 
                        variant={pred.status === 'HEALTHY' ? 'secondary' : pred.status === 'WARNING' ? 'outline' : 'destructive'}
                        className={
                          pred.status === 'HEALTHY' ? 'text-success border-success/30' :
                          pred.status === 'WARNING' ? 'text-warning border-warning/30' :
                          ''
                        }
                      >
                        {pred.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PredictionsPage;