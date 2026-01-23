import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Send,
  FileText,
  Activity
} from 'lucide-react';

interface SimulationStep {
  step_number: number;
  step_name: string;
  status: 'waiting' | 'processing' | 'complete' | 'error';
  started_at?: string;
  completed_at?: string;
  details?: string;
  result?: any;
}

interface SimulationData {
  id: string;
  failure_mode: string;
  status: string;
  current_step: number;
  steps: SimulationStep[];
  prediction_data?: any;
  analytics_data?: any;
  report_data?: any;
  inventory_data?: any;
  dispatch_data?: any;
  notifications_data?: any;
}

const AIAnalyticsSimulation = () => {
  const [selectedFailureMode, setSelectedFailureMode] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const backend_url = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  const ws_url = backend_url.replace('http', 'ws').replace('https', 'wss');

  const failureModes = [
    { value: 'bearing_wear', label: '🔧 Bearing Wear', description: 'High vibration and temperature' },
    { value: 'motor_overheat', label: '🔥 Motor Overheat', description: 'Cooling system failure' },
    { value: 'pump_cavitation', label: '💧 Pump Cavitation', description: 'Low suction pressure' }
  ];

  const startSimulation = async (failureMode: string) => {
    if (!failureMode) return;

    setIsSimulating(true);
    setSimulationData(null);
    setSelectedFailureMode(failureMode);

    try {
      // Start simulation
      const response = await fetch(`${backend_url}/api/ai-analytics/simulate-failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failure_mode: failureMode,
          equipment_id: 'pump-001',
          run_full_cycle: true
        })
      });

      if (!response.ok) {
        throw new Error('Simulation failed to start');
      }

      const data = await response.json();
      
      if (data.success) {
        // Connect to WebSocket for live updates
        connectWebSocket(data.simulation_id);
        
        // Also poll for status updates as backup
        pollSimulationStatus(data.simulation_id);
      }

    } catch (error) {
      console.error('Simulation error:', error);
      alert('Failed to start simulation. Check console for details.');
      setIsSimulating(false);
    }
  };

  const connectWebSocket = (simulationId: string) => {
    const ws = new WebSocket(`${ws_url}/ws/simulation-progress/${simulationId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);

      if (message.type === 'step_update') {
        // Update simulation data with new step info
        setSimulationData(prev => {
          if (!prev) return null;
          
          const updatedSteps = [...prev.steps];
          const stepIndex = message.step.step_number - 1;
          updatedSteps[stepIndex] = message.step;

          return {
            ...prev,
            steps: updatedSteps,
            current_step: message.current_step
          };
        });
      } else if (message.type === 'simulation_complete') {
        console.log('Simulation complete!');
        setSimulationData(message.simulation);
        setIsSimulating(false);
        ws.close();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    wsRef.current = ws;
  };

  const pollSimulationStatus = async (simulationId: string) => {
    const maxAttempts = 60; // 60 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${backend_url}/api/ai-analytics/simulation/${simulationId}`);
        const data = await response.json();

        if (data.success) {
          setSimulationData(data.simulation);

          if (data.simulation.status === 'complete' || data.simulation.status === 'error') {
            setIsSimulating(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts && isSimulating) {
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
  };

  useEffect(() => {
    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getStepIcon = (step: SimulationStep) => {
    if (step.status === 'complete') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (step.status === 'processing') return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (step.status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500/10 border-green-500/30';
      case 'processing': return 'bg-blue-500/10 border-blue-500/30 animate-pulse';
      case 'error': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

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
                AI Analytics Simulation
              </h1>
              <p className="text-muted-foreground mt-1">
                Interactive failure mode simulation with real-time progress tracking
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              {wsConnected ? '🟢 Live' : '⚪ Offline'}
            </Badge>
          </div>

          {/* Failure Mode Selector */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Select Failure Mode to Simulate
              </CardTitle>
              <CardDescription>
                Choose a failure scenario to trigger the complete AI analytics pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {failureModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => startSimulation(mode.value)}
                    disabled={isSimulating}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-lg ${
                      selectedFailureMode === mode.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    } ${isSimulating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-lg font-semibold mb-1">{mode.label}</div>
                    <div className="text-sm text-muted-foreground">{mode.description}</div>
                  </button>
                ))}
              </div>

              {isSimulating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Simulation in progress...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simulation Progress */}
          {simulationData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Progress</CardTitle>
                  <CardDescription>
                    Live updates from the AI analytics pipeline - Step {simulationData.current_step} of 6
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {simulationData.steps.map((step, index) => (
                      <div
                        key={step.step_number}
                        className={`p-4 rounded-lg border-2 transition-all ${getStepStatusColor(step.status)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getStepIcon(step)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold">
                                Step {step.step_number}: {step.step_name}
                              </h4>
                              <Badge variant={step.status === 'complete' ? 'default' : 'outline'}>
                                {step.status === 'complete' && '✅ Complete'}
                                {step.status === 'processing' && '⏳ Processing'}
                                {step.status === 'waiting' && '⏸️ Waiting'}
                                {step.status === 'error' && '❌ Error'}
                              </Badge>
                            </div>
                            {step.details && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {step.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Results Display (Only when complete) */}
              {simulationData.status === 'complete' && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Prediction Results */}
                  {simulationData.prediction_data && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Prediction Generated
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Equipment</p>
                          <p className="text-lg font-semibold">{simulationData.prediction_data.equipment_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Failure Type</p>
                          <p className="text-lg font-semibold">{simulationData.prediction_data.predicted_failure}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className="text-xl font-bold text-primary">{simulationData.prediction_data.confidence_score}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Health Score</p>
                            <p className="text-xl font-bold">{simulationData.prediction_data.health_score}/100</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Analytics Results */}
                  {simulationData.analytics_data && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Analytics & Impact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Financial Impact</p>
                          <p className="text-lg font-semibold">
                            ${simulationData.analytics_data.analytics_package.impact_analysis.total_financial_impact.toLocaleString()}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Downtime</p>
                            <p className="text-xl font-bold">{simulationData.analytics_data.analytics_package.impact_analysis.downtime_hours}h</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Repair Cost</p>
                            <p className="text-xl font-bold">${simulationData.analytics_data.analytics_package.impact_analysis.cost.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Inventory Status */}
                  {simulationData.inventory_data && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Inventory Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Parts Available</p>
                            <p className="text-xl font-bold text-green-600">
                              {simulationData.inventory_data.available_parts}/{simulationData.inventory_data.total_parts_needed}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Need to Order</p>
                            <p className="text-xl font-bold text-orange-600">
                              {simulationData.inventory_data.parts_to_order?.length || 0}
                            </p>
                          </div>
                        </div>
                        {simulationData.inventory_data.reserved_parts?.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Reserved Parts</p>
                            <div className="flex flex-wrap gap-1">
                              {simulationData.inventory_data.reserved_parts.map((part: any, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {part.part_name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Dispatch Information */}
                  {simulationData.dispatch_data && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Technician Dispatch
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Assigned Technician</p>
                          <p className="text-lg font-semibold">
                            {simulationData.dispatch_data.technician.first_name} {simulationData.dispatch_data.technician.last_name}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Experience</p>
                            <p className="text-xl font-bold">{simulationData.dispatch_data.technician.experience_years} years</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Skill Match</p>
                            <p className="text-xl font-bold text-green-600">{simulationData.dispatch_data.skill_match}%</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="default" className="mt-1">
                            ✅ Dispatched - ETA: {simulationData.dispatch_data.estimated_arrival}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Report Generated */}
                  {simulationData.report_data && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Automated Report Generated
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Report ID</p>
                            <p className="font-mono text-sm">{simulationData.report_data.report_id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Executive Summary</p>
                            <p className="text-sm">{simulationData.report_data.executive_summary}</p>
                          </div>
                          <Button className="w-full sm:w-auto">
                            📥 Download Full Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!simulationData && !isSimulating && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-semibold mb-2">No Simulation Running</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Select a failure mode above to start the AI analytics simulation and see the complete pipeline in action
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AIAnalyticsSimulation;
