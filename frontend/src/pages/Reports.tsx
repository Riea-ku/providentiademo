import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Download, 
  Calendar,
  Clock,
  MessageSquare,
  Send,
  Loader2,
  Plus,
  RefreshCw,
  Mail,
  Printer,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Report {
  id: string;
  report_number: string | null;
  title: string;
  report_type: string;
  status: string | null;
  summary: string | null;
  created_at: string;
  sections: unknown;
  recommendations: string[] | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STATUS_SYMBOLS = {
  generated: '[*]',
  pending: '[~]',
  sent: '[>]',
  error: '[X]'
};

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState('maintenance');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
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
      content: `Generate a ${reportType} report` 
    }]);
    
    try {
      const { data, error } = await supabase.functions.invoke('agri-assistant', {
        body: {
          messages: [
            { role: 'user', content: `[GENERATE REPORT] Create a comprehensive ${reportType} report with executive summary, key findings, risk assessment, and recommendations. Format it professionally with clear sections.` }
          ],
          session_id: crypto.randomUUID()
        }
      });
      
      if (error) throw error;
      
      const responseText = typeof data === 'string' ? data : data?.response || 'Report generated successfully.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      // Refresh reports list
      await fetchReports();
    } catch (error) {
      console.error('Report generation error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error generating the report. Please try again.' 
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
      const { data, error } = await supabase.functions.invoke('agri-assistant', {
        body: {
          messages: [
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: `[REPORTS CONTEXT] ${userMessage}` }
          ],
          session_id: crypto.randomUUID()
        }
      });
      
      if (error) throw error;
      
      const responseText = typeof data === 'string' ? data : data?.response || 'I can help you create and understand reports. What would you like to know?';
      setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'generated':
        return <Badge variant="default">{STATUS_SYMBOLS.generated} Generated</Badge>;
      case 'sent':
        return <Badge variant="secondary">{STATUS_SYMBOLS.sent} Sent</Badge>;
      case 'pending':
        return <Badge variant="outline">{STATUS_SYMBOLS.pending} Pending</Badge>;
      default:
        return <Badge variant="outline">{STATUS_SYMBOLS.pending} {status || 'Unknown'}</Badge>;
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
                          <SelectItem value="maintenance">Maintenance Summary</SelectItem>
                          <SelectItem value="equipment">Equipment Analysis</SelectItem>
                          <SelectItem value="cost">Cost Analysis</SelectItem>
                          <SelectItem value="prediction">Prediction Report</SelectItem>
                          <SelectItem value="technician">Technician Performance</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                          <SelectItem value="monthly">Monthly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={generatingReport}>
                      {generatingReport ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Table */}
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
                                <span className="font-mono text-xs text-muted-foreground">
                                  {report.report_number || 'RPT-PENDING'}
                                </span>
                                {getStatusBadge(report.status)}
                              </div>
                              <h3 className="font-medium">{report.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {report.summary || 'No summary available'}
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
                              {formatDate(report.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {report.report_type}
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
                      <span>Report Preview: {selectedReport.report_number}</span>
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
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <h2>{selectedReport.title}</h2>
                      
                      {selectedReport.summary && (
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <h4 className="font-medium mb-2">Executive Summary</h4>
                          <p>{selectedReport.summary}</p>
                        </div>
                      )}
                      
                      {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <ul className="space-y-2">
                            {selectedReport.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                        <p>Report ID: {selectedReport.id}</p>
                        <p>Generated: {formatDate(selectedReport.created_at)}</p>
                        <p>Type: {selectedReport.report_type}</p>
                      </div>
                    </div>
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
                        onClick={() => setChatInput('Create a weekly maintenance summary')}
                      >
                        {'[>]'} Create weekly maintenance summary
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Generate a cost analysis report')}
                      >
                        {'[>]'} Generate cost analysis report
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Explain what should be in a prediction report')}
                      >
                        {'[>]'} What's in a prediction report?
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Schedule automated weekly reports')}
                      >
                        {'[>]'} Schedule automated reports
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
