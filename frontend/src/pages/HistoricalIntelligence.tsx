import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Package,
  Calendar,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import { historicalSystem } from '@/lib/historicalContext';

const HistoricalIntelligenceDashboard = () => {
  const [patterns, setPatterns] = useState<any>(null);
  const [timePeriod, setTimePeriod] = useState('365d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalPatterns();
  }, [timePeriod]);

  const loadHistoricalPatterns = async () => {
    try {
      setLoading(true);
      const data = await historicalSystem.analyzePatterns(timePeriod);
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const timePeriods = [
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '365d', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <Header />
        
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Brain className="w-8 h-8 text-primary" />
                Historical Intelligence
              </h1>
              <p className="text-muted-foreground mt-1">
                Patterns, trends, and insights from historical data
              </p>
            </div>
            
            {/* Time Period Selector */}
            <div className="flex gap-2">
              {timePeriods.map((period) => (
                <Button
                  key={period.value}
                  variant={timePeriod === period.value ? 'default' : 'outline'}
                  onClick={() => setTimePeriod(period.value)}
                  size="sm"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing historical patterns...</p>
              </div>
            </div>
          ) : patterns ? (
            <>
              {/* Key Metrics */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Failures</p>
                        <p className="text-2xl font-bold">{patterns.failure_patterns?.total_failures || 0}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">
                          {patterns.maintenance_patterns?.completion_rate?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">
                          ${(patterns.cost_patterns?.total_cost || 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Technicians</p>
                        <p className="text-2xl font-bold">
                          {patterns.technician_patterns?.total_technicians || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Predictive Insights */}
              {patterns.predictive_insights && patterns.predictive_insights.length > 0 && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      AI-Generated Insights
                    </CardTitle>
                    <CardDescription>
                      Actionable recommendations based on historical patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patterns.predictive_insights.map((insight: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                          <div className="flex-shrink-0 mt-1">
                            {insight.includes('⚠️') && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                            {insight.includes('✅') && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {insight.includes('📊') && <BarChart3 className="w-5 h-5 text-blue-500" />}
                            {insight.includes('📅') && <Calendar className="w-5 h-5 text-purple-500" />}
                            {!insight.match(/[⚠️✅📊📅]/) && <TrendingUp className="w-5 h-5 text-primary" />}
                          </div>
                          <p className="text-sm">{insight.replace(/[⚠️✅📊📅]/g, '').trim()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Failure Patterns */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Failure Types Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patterns.failure_patterns?.failure_types && 
                     Object.keys(patterns.failure_patterns.failure_types).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(patterns.failure_patterns.failure_types)
                          .sort((a: any, b: any) => b[1] - a[1])
                          .map(([type, count]: [string, any]) => {
                            const percentage = patterns.failure_patterns.total_failures > 0
                              ? (count / patterns.failure_patterns.total_failures * 100).toFixed(1)
                              : 0;
                            return (
                              <div key={type}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium capitalize">
                                    {type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No failure data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Cost Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Average Cost per Failure</span>
                        <span className="text-lg font-bold">
                          ${(patterns.cost_patterns?.avg_cost_per_failure || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Cost Trend</span>
                        <Badge variant={
                          patterns.cost_patterns?.cost_trend === 'increasing' ? 'destructive' :
                          patterns.cost_patterns?.cost_trend === 'decreasing' ? 'default' :
                          'secondary'
                        }>
                          {patterns.cost_patterns?.cost_trend === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {patterns.cost_patterns?.cost_trend === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {patterns.cost_patterns?.cost_trend || 'Stable'}
                        </Badge>
                      </div>
                    </div>

                    {patterns.cost_patterns?.most_expensive_failure && (
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-sm font-medium mb-1">Most Expensive Failure Type</p>
                        <p className="text-lg font-bold capitalize">
                          {patterns.cost_patterns.most_expensive_failure[0]?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${patterns.cost_patterns.most_expensive_failure[1]?.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* High-Risk Equipment */}
              {patterns.failure_patterns?.high_risk_equipment && 
               Object.keys(patterns.failure_patterns.high_risk_equipment).length > 0 && (
                <Card className="border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-500" />
                      High-Risk Equipment
                    </CardTitle>
                    <CardDescription>
                      Equipment with frequent failures requiring attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-3">
                      {Object.entries(patterns.failure_patterns.high_risk_equipment)
                        .sort((a: any, b: any) => b[1] - a[1])
                        .map(([equipmentId, failureCount]: [string, any]) => (
                          <div 
                            key={equipmentId}
                            className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer"
                          >
                            <p className="font-semibold">{equipmentId}</p>
                            <p className="text-sm text-muted-foreground">
                              {failureCount} failures
                            </p>
                            <Badge variant="destructive" className="mt-2">
                              High Risk
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Maintenance Performance */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Maintenance Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Completed</span>
                        <span className="text-lg font-bold text-green-600">
                          {patterns.maintenance_patterns?.completed || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">In Progress</span>
                        <span className="text-lg font-bold text-blue-600">
                          {patterns.maintenance_patterns?.in_progress || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <span className="text-lg font-bold text-orange-600">
                          {patterns.maintenance_patterns?.pending || 0}
                        </span>
                      </div>
                    </div>

                    {patterns.maintenance_patterns?.avg_response_time_hours > 0 && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm font-medium mb-1">Average Response Time</p>
                        <p className="text-2xl font-bold">
                          {patterns.maintenance_patterns.avg_response_time_hours.toFixed(1)}h
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Technician Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patterns.technician_patterns?.top_performers && 
                     Object.keys(patterns.technician_patterns.top_performers).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(patterns.technician_patterns.top_performers)
                          .slice(0, 5)
                          .map(([techId, metrics]: [string, any]) => (
                            <div key={techId} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                              <div>
                                <p className="font-semibold">{techId}</p>
                                <p className="text-xs text-muted-foreground">
                                  {metrics.assignments} assignments
                                </p>
                              </div>
                              <Badge variant="default">
                                {metrics.completion_rate?.toFixed(0)}%
                              </Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No technician data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Seasonal Patterns */}
              {patterns.seasonal_patterns?.seasonal_pattern_detected && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Seasonal Patterns
                    </CardTitle>
                    <CardDescription>
                      Monthly failure and cost distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-2">
                      {Object.entries(patterns.seasonal_patterns.monthly_failure_distribution || {})
                        .map(([month, count]: [string, any]) => {
                          const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const isPeak = parseInt(month) === patterns.seasonal_patterns.peak_failure_month;
                          return (
                            <div 
                              key={month}
                              className={`p-2 rounded text-center ${isPeak ? 'bg-red-500/20 border-2 border-red-500' : 'bg-muted'}`}
                            >
                              <p className="text-xs font-medium">{monthNames[parseInt(month)]}</p>
                              <p className="text-sm font-bold">{count}</p>
                            </div>
                          );
                        })}
                    </div>
                    {patterns.seasonal_patterns.peak_failure_month > 0 && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Peak failure month: {['', 'January', 'February', 'March', 'April', 'May', 'June', 
                                              'July', 'August', 'September', 'October', 'November', 'December'][patterns.seasonal_patterns.peak_failure_month]}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Anomalies */}
              {patterns.anomalies && (patterns.anomalies.cost_spikes?.length > 0 || patterns.anomalies.unusual_patterns?.length > 0) && (
                <Card className="border-yellow-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Detected Anomalies
                    </CardTitle>
                    <CardDescription>
                      Unusual patterns requiring investigation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patterns.anomalies.cost_spikes?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Cost Spikes</h4>
                        <div className="space-y-2">
                          {patterns.anomalies.cost_spikes.slice(0, 3).map((spike: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                              <p className="text-sm font-medium">
                                Simulation {spike.simulation_id?.slice(0, 8)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cost: ${spike.cost?.toLocaleString()} ({spike.deviation?.toFixed(1)}x normal)
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {patterns.anomalies.unusual_patterns?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Unusual Failure Clusters</h4>
                        <div className="space-y-2">
                          {patterns.anomalies.unusual_patterns.slice(0, 3).map((pattern: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                              <p className="text-sm font-medium">{pattern.date}</p>
                              <p className="text-xs text-muted-foreground">
                                {pattern.failure_count} failures ({pattern.deviation?.toFixed(1)}x normal rate)
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-semibold mb-2">No Historical Data</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Start running simulations to build historical intelligence and unlock powerful insights
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoricalIntelligenceDashboard;
