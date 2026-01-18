import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { date: 'Jan 12', predictions: 45, failures: 3 },
  { date: 'Jan 13', predictions: 52, failures: 4 },
  { date: 'Jan 14', predictions: 48, failures: 2 },
  { date: 'Jan 15', predictions: 61, failures: 5 },
  { date: 'Jan 16', predictions: 55, failures: 3 },
  { date: 'Jan 17', predictions: 67, failures: 4 },
  { date: 'Jan 18', predictions: 72, failures: 6 },
];

export function PredictionTrendChart() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Prediction Activity (7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPredictions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 70% 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0 70% 55%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(235 30% 20%)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(235 25% 65%)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(235 25% 65%)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(235 45% 12%)',
                  border: '1px solid hsl(235 30% 18%)',
                  borderRadius: '8px',
                  color: 'hsl(230 30% 92%)',
                }}
              />
              <Area
                type="monotone"
                dataKey="predictions"
                stroke="hsl(262 83% 58%)"
                fillOpacity={1}
                fill="url(#colorPredictions)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="failures"
                stroke="hsl(0 70% 55%)"
                fillOpacity={1}
                fill="url(#colorFailures)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Predictions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Failures Detected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}