import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  Plus,
  RefreshCw,
  Mail,
  Printer,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface GeneratedReport {
  id: string;
  title: string;
  summary: string;
  content: {
    full_text: string;
    report_type: string;
    generated_at: string;
  };
  report_type: string;
  generated_by: string;
  created_at?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const REPORT_TYPES = [
  { value: 'maintenance_summary', label: 'Maintenance Summary' },
  { value: 'equipment_analysis', label: 'Equipment Analysis' },
  { value: 'cost_analysis', label: 'Cost Analysis' },
  { value: 'prediction', label: 'Prediction Report' },
  { value: 'technician_performance', label: 'Technician Performance' },
  { value: 'weekly_summary', label: 'Weekly Summary' },
  { value: 'monthly_summary', label: 'Monthly Summary' }
];

const Reports = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState('maintenance_summary');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/generated-reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setChatMessages(prev => [...prev, { 
      role: 'user', 
      content: `Generate a ${REPORT_TYPES.find(t => t.value === reportType)?.label || reportType} report` 
    }]);
    
    try {
      const response = await fetch(`${backendUrl}/api/reports/generate-intelligent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          current_data: {
            equipment: 'All Equipment',
            period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          },
          parameters: {
            period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Report generation failed');
      }
      
      const data = await response.json();
      
      if (data.success && data.report) {
        // Add new report to list
        setReports(prev => [data.report, ...prev]);
        setSelectedReport(data.report);
        
        const summary = data.report.summary || 'Report generated successfully!';
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Report generated successfully!\n\n**${data.report.title}**\n\n${summary.substring(0, 500)}${summary.length > 500 ? '...' : ''}\n\nClick on the report in the list to view the full content.`
        }]);
      } else {
        throw new Error('No report returned');
      }
      
    } catch (error) {
      console.error('Report generation error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ I encountered an error generating the report. Please try again.' 
      }]);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      // Check if user wants to generate a report
      const lowerMsg = userMessage.toLowerCase();
      let matchedType = null;
      
      for (const type of REPORT_TYPES) {
        if (lowerMsg.includes(type.label.toLowerCase()) || lowerMsg.includes(type.value.replace('_', ' '))) {
          matchedType = type.value;
          break;
        }
      }
      
      if (lowerMsg.includes('generate') || lowerMsg.includes('create')) {
        if (matchedType) {
          setReportType(matchedType);
          setChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `I'll generate a ${REPORT_TYPES.find(t => t.value === matchedType)?.label} report for you now...`
          }]);
          setChatLoading(false);
          
          // Auto-trigger report generation
          setTimeout(() => handleGenerateReport(), 500);
          return;
        }
      }
      
      // Default response
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I can help you generate various reports. Available report types:\n\n${REPORT_TYPES.map(t => `• ${t.label}`).join('\n')}\n\nJust say "Generate a [report type]" or select from the dropdown and click Generate Report.`
      }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error. Please try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <Header />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports Center</h1>
              <p className="text-muted-foreground">Generate, view, and manage technical reports</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchReports}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Generation Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Generate New Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">Report Type</label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {REPORT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={generatingReport}>
                      {generatingReport ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No reports generated yet</p>
                      <p className="text-sm mt-1">Use the form above to create your first report</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div 
                          key={report.id} 
                          className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                            selectedReport?.id === report.id ? 'border-primary bg-muted/50' : ''
                          }`}
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="default">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Generated
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {report.report_type?.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <h3 className="font-medium">{report.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {report.summary || 'Click to view full report'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button variant="ghost" size="icon" title="Download PDF">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Email Report">
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Print">
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {report.content?.generated_at ? formatDate(report.content.generated_at) : 'Just now'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              AI Generated
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Report Preview */}
              {selectedReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Report Preview</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-wrap text-sm">
                          {selectedReport.content?.full_text || selectedReport.summary || 'No content available'}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Report Assistant Chat */}
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Report Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">I can help you create and understand reports</p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Generate a maintenance summary report')}
                      >
                        {'▶️'} Create weekly maintenance summary
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Generate a cost analysis report')}
                      >
                        {'▶️'} Generate cost analysis report
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('What types of reports can you generate?')}
                      >
                        {'▶️'} What's in a prediction report?
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Generate a monthly summary report')}
                      >
                        {'▶️'} Schedule automated reports
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
                    placeholder="Ask about reports..."
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
          [C] 2026 Vida Technologies | Vida Enterprise Platform v3.0
        </footer>
      </main>
    </div>
  );
};

export default Reports;
