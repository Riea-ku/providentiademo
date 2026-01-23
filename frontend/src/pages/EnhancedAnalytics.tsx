import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp, 
  Clock, 
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  Send,
  Activity,
  Target
} from 'lucide-react';

interface PredictionAnalytics {
  analytics_id: string;
  prediction_id: string;
  impact_analysis: {
    cost: number;
    downtime_hours: number;
    production_loss: number;
    revenue_impact: number;
    total_financial_impact: number;
  };
  recommendations: string[];
  confidence_metrics: {
    data_quality: number;
    model_score: number;
    historical_accuracy: number;
  };
  resource_requirements: {
    technicians_required: number;
    estimated_hours: number;
    estimated_parts_cost: number;
    required_skills: string[];
  };
}

const EnhancedAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [demoData, setDemoData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const backend_url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  const runDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backend_url}/api/demo/simulate-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setDemoData(data);
    } catch (error) {
      console.error('Demo error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!demoData?.analytics_id) return;
    
    setGeneratingReport(true);
    try {
      const response = await fetch(
        `${backend_url}/api/analytics/${demoData.analytics_id}/generate-report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const reportData = await response.json();
      console.log('Report generated:', reportData);
      setReportGenerated(true);
    } catch (error) {
      console.error('Report generation error:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Brain className="w-8 h-8 text-primary" />
                Predictive Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered equipment health analysis with automated reporting
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              Vida AI Powered
            </Badge>
          </div>

          {/* Demo Control */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Live Demo: Full Predictive Analytics Pipeline
              </CardTitle>
              <CardDescription>
                Simulate: Prediction → Analytics → AI Explanation → Report → Dispatch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runDemo} 
                disabled={loading}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Demo Prediction
                  </>
                )}
              </Button>
              {demoData && (
                <p className="text-sm text-muted-foreground mt-2">
                  ✅ Demo complete! Analytics generated for: {demoData.prediction.equipment_name}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results Display */}
          {demoData && (
            <Tabs defaultValue="prediction" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prediction">🎯 Prediction</TabsTrigger>
                <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
                <TabsTrigger value="impact">💰 Impact</TabsTrigger>
                <TabsTrigger value="actions">⚡ Actions</TabsTrigger>
              </TabsList>

              {/* Prediction Tab */}
              <TabsContent value="prediction" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Prediction Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Equipment</p>
                        <p className="text-lg font-semibold">{demoData.prediction.equipment_name}</p>
                      </div>
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Health Score</p>
                        <p className="text-lg font-semibold">{demoData.prediction.health_score}/100</p>
                      </div>
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">{demoData.prediction.confidence_score}%</p>
                      </div>
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Time to Failure</p>
                        <p className="text-lg font-semibold">{demoData.prediction.time_to_failure_hours}h</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="font-semibold text-amber-700 dark:text-amber-300">
                        ⚠️ Predicted Issue: {demoData.prediction.predicted_failure}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Severity: <Badge variant="outline" className="ml-1">{demoData.prediction.severity}</Badge>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Data Quality */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Data Quality</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <div className="text-4xl font-bold text-primary">
                          {demoData.analytics.confidence_metrics.data_quality}%
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        High quality sensor data
                      </p>
                    </CardContent>
                  </Card>

                  {/* Model Accuracy */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Model Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <div className="text-4xl font-bold text-primary">
                          {demoData.analytics.confidence_metrics.model_score}%
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        AI prediction confidence
                      </p>
                    </CardContent>
                  </Card>

                  {/* Historical Accuracy */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Historical Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <div className="text-4xl font-bold text-primary">
                          {demoData.analytics.confidence_metrics.historical_accuracy}%
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Past prediction success rate
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Resource Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">👷 Technicians Required</p>
                        <p className="text-2xl font-bold">{demoData.analytics.resource_requirements.technicians_required}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">⏱️ Estimated Hours</p>
                        <p className="text-2xl font-bold">{demoData.analytics.resource_requirements.estimated_hours}h</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">💰 Parts Cost</p>
                        <p className="text-2xl font-bold">${demoData.analytics.resource_requirements.estimated_parts_cost}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">🛠️ Required Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {demoData.analytics.resource_requirements.required_skills.map((skill: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Impact Tab */}
              <TabsContent value="impact" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-2 border-red-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-red-500" />
                        Financial Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Repair Cost:</span>
                          <span className="font-semibold">${demoData.analytics.impact_analysis.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Revenue Impact:</span>
                          <span className="font-semibold">${demoData.analytics.impact_analysis.revenue_impact.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Total Impact:</span>
                          <span className="text-xl font-bold text-red-500">
                            ${demoData.analytics.impact_analysis.total_financial_impact.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-amber-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Operational Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Estimated Downtime:</span>
                          <span className="font-semibold">{demoData.analytics.impact_analysis.downtime_hours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Production Loss:</span>
                          <span className="font-semibold">{demoData.analytics.impact_analysis.production_loss} units</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Urgency Level:</span>
                          <Badge variant="destructive" className="ml-2">
                            {demoData.prediction.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {demoData.analytics.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Report Generation */}
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Automated Report Generation
                    </CardTitle>
                    <CardDescription>
                      Generate dispatch-ready technician report with all details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!reportGenerated ? (
                      <Button 
                        onClick={generateReport}
                        disabled={generatingReport}
                        size="lg"
                        className="w-full"
                      >
                        {generatingReport ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Technician Dispatch Report
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Report Generated Successfully!
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Dispatch-ready report created with all safety instructions and parts list
                          </p>
                        </div>
                        <Button variant="outline" className="w-full">
                          <Send className="w-4 h-4 mr-2" />
                          Dispatch to Technician
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Empty State */}
          {!demoData && !loading && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                <p className="text-muted-foreground mb-4">
                  Run a demo prediction to see the full analytics pipeline in action
                </p>
                <Button onClick={runDemo} variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Demo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
          [C] 2026 Vida Technologies | Vida Enterprise Platform v3.0
        </footer>
      </main>
    </div>
  );
};

export default EnhancedAnalytics;
