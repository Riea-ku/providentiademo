import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Send,
  Loader2,
  Activity,
  Target,
  Gauge
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  equipmentAvailability: number;
  mtbf: number;
  mttr: number;
  totalWorkOrders: number;
  completedWorkOrders: number;
  totalMaintenanceCost: number;
  technicianUtilization: number;
  criticalAlerts: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STATUS_SYMBOLS = {
  excellent: '[*]',
  good: '[+]',
  warning: '[!]',
  critical: '[X]'
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    equipmentAvailability: 0,
    mtbf: 0,
    mttr: 0,
    totalWorkOrders: 0,
    completedWorkOrders: 0,
    totalMaintenanceCost: 0,
    technicianUtilization: 0,
    criticalAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Mock trend data for charts
  const [trendData] = useState([
    { month: 'Jan', availability: 94, mttr: 3.2, cost: 12500 },
    { month: 'Feb', availability: 92, mttr: 3.8, cost: 15200 },
    { month: 'Mar', availability: 96, mttr: 2.9, cost: 11800 },
    { month: 'Apr', availability: 95, mttr: 3.1, cost: 13400 },
    { month: 'May', availability: 97, mttr: 2.6, cost: 10900 },
    { month: 'Jun', availability: 98, mttr: 2.3, cost: 9800 }
  ]);

  const [workOrderData] = useState([
    { name: 'Completed', value: 45 },
    { name: 'In Progress', value: 12 },
    { name: 'Pending', value: 8 },
    { name: 'Cancelled', value: 3 }
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch equipment data
      const { data: equipment } = await supabase
        .from('equipment')
        .select('status');
      
      const operationalCount = equipment?.filter(e => e.status === 'operational').length || 0;
      const totalEquipment = equipment?.length || 1;
      
      // Fetch work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('status, estimated_cost, actual_cost');
      
      const completedWO = workOrders?.filter(w => w.status === 'completed').length || 0;
      const totalWO = workOrders?.length || 0;
      const totalCost = workOrders?.reduce((sum, w) => sum + (w.actual_cost || w.estimated_cost || 0), 0) || 0;
      
      // Fetch alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('severity')
        .eq('acknowledged', false);
      
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;
      
      // Fetch technicians
      const { data: technicians } = await supabase
        .from('technicians')
        .select('status');
      
      const busyTechs = technicians?.filter(t => t.status === 'on_job').length || 0;
      const totalTechs = technicians?.length || 1;
      
      setAnalytics({
        equipmentAvailability: Math.round((operationalCount / totalEquipment) * 100),
        mtbf: 156, // Mock: Mean Time Between Failures in hours
        mttr: 2.8, // Mock: Mean Time To Repair in hours
        totalWorkOrders: totalWO,
        completedWorkOrders: completedWO,
        totalMaintenanceCost: totalCost,
        technicianUtilization: Math.round((busyTechs / totalTechs) * 100),
        criticalAlerts
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('agri-assistant', {
        body: {
          messages: [
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: `[ANALYTICS QUERY] ${userMessage}. Current metrics: Equipment Availability: ${analytics.equipmentAvailability}%, MTBF: ${analytics.mtbf}h, MTTR: ${analytics.mttr}h, Work Orders: ${analytics.totalWorkOrders}, Completed: ${analytics.completedWorkOrders}` }
          ],
          session_id: crypto.randomUUID()
        }
      });
      
      if (error) throw error;
      
      const responseText = typeof data === 'string' ? data : data?.response || 'I can help analyze your metrics. Ask about trends, KPIs, or specific performance data.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error processing your analytics query. Please try rephrasing your question.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getMetricStatus = (value: number, thresholds: { excellent: number; good: number; warning: number }) => {
    if (value >= thresholds.excellent) return { symbol: STATUS_SYMBOLS.excellent, color: 'text-green-500' };
    if (value >= thresholds.good) return { symbol: STATUS_SYMBOLS.good, color: 'text-blue-500' };
    if (value >= thresholds.warning) return { symbol: STATUS_SYMBOLS.warning, color: 'text-yellow-500' };
    return { symbol: STATUS_SYMBOLS.critical, color: 'text-destructive' };
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <Header />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Performance metrics, KPIs, and trend analysis</p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              Real-time Data
            </Badge>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Equipment Availability</p>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${getMetricStatus(analytics.equipmentAvailability, { excellent: 95, good: 85, warning: 70 }).color}`}>
                        {getMetricStatus(analytics.equipmentAvailability, { excellent: 95, good: 85, warning: 70 }).symbol}
                      </span>
                      <p className="text-2xl font-bold">{analytics.equipmentAvailability}%</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Target: 95%</p>
                  </div>
                  <Gauge className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">MTBF</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-green-500">{STATUS_SYMBOLS.excellent}</span>
                      <p className="text-2xl font-bold">{analytics.mtbf}h</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Mean Time Between Failures</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">MTTR</p>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${getMetricStatus(100 - analytics.mttr * 10, { excellent: 80, good: 60, warning: 40 }).color}`}>
                        {getMetricStatus(100 - analytics.mttr * 10, { excellent: 80, good: 60, warning: 40 }).symbol}
                      </span>
                      <p className="text-2xl font-bold">{analytics.mttr}h</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Mean Time To Repair</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance Cost</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary">[#]</span>
                      <p className="text-2xl font-bold">${analytics.totalMaintenanceCost.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Charts Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Availability Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis domain={[85, 100]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="availability" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Work Order Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={workOrderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {workOrderData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {workOrderData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1 text-xs">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          {entry.name}: {entry.value}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Cost Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="cost" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary KPIs */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{analytics.technicianUtilization}%</p>
                      <p className="text-xs text-muted-foreground">Tech Utilization</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Wrench className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{analytics.completedWorkOrders}/{analytics.totalWorkOrders}</p>
                      <p className="text-xs text-muted-foreground">Work Orders</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Target className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{analytics.totalWorkOrders > 0 ? Math.round((analytics.completedWorkOrders / analytics.totalWorkOrders) * 100) : 0}%</p>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-destructive" />
                      <p className="text-2xl font-bold text-destructive">{analytics.criticalAlerts}</p>
                      <p className="text-xs text-muted-foreground">Critical Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Assistant Chat */}
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Analytics Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">Ask about metrics and trends</p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Summarize this month\'s performance')}
                      >
                        {'[>]'} Summarize this month's performance
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('What does MTBF mean and is ours good?')}
                      >
                        {'[>]'} What does MTBF mean?
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Show me cost trends and recommendations')}
                      >
                        {'[>]'} Cost trends and recommendations
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Which technician is most productive?')}
                      >
                        {'[>]'} Top performing technicians
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground ml-8' 
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="bg-muted p-3 rounded-lg mr-8">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about analytics..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleChatSubmit())}
                    className="min-h-[40px] max-h-[100px] resize-none"
                    rows={1}
                  />
                  <Button onClick={handleChatSubmit} disabled={chatLoading || !chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
          [C] 2026 Providentia Technologies | Providentia Enterprise Platform v3.0
        </footer>
      </main>
    </div>
  );
};

export default Analytics;
