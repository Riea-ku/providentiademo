import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoricalContextPanel } from '@/components/historical/HistoricalContextPanel';
import { HistoricalTimeline } from '@/components/historical/HistoricalTimeline';
import { ReportDetailsDialog } from '@/components/historical/ReportDetailsDialog';
import { historicalService, HistoricalReport } from '@/services/historicalService';
import { 
  Search, 
  Database, 
  TrendingUp, 
  FileText, 
  Brain,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

const HistoricalIntelligenceDemo = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HistoricalReport[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HistoricalReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allReports, setAllReports] = useState<HistoricalReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStatus();
    loadAllReports();
  }, []);

  const loadSystemStatus = async () => {
    const status = await historicalService.getStatus();
    setSystemStatus(status);
  };

  const loadAllReports = async () => {
    setLoading(true);
    try {
      // Load all reports by searching with empty query
      const reports = await historicalService.searchReports('', {}, 100);
      setAllReports(reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await historicalService.searchReports(searchQuery, {}, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleReportClick = (report: HistoricalReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const StatusIndicator = ({ active }: { active: boolean }) => (
    active ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Historical Intelligence System" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Real-time status of the Historical Intelligence System
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemStatus ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <StatusIndicator active={systemStatus.success} />
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {systemStatus.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Database className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Database</p>
                        <p className="text-xs text-muted-foreground">
                          {systemStatus.database}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Reports</p>
                        <p className="text-xs text-muted-foreground">
                          {systemStatus.reports_count} stored
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Events</p>
                        <p className="text-xs text-muted-foreground">
                          {systemStatus.events_count} tracked
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {systemStatus?.features && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Features:</span>
                    {systemStatus.features.map((feature: string) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Semantic Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Semantic Search
                </CardTitle>
                <CardDescription>
                  Search through all historical reports using natural language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search reports... (e.g., 'bearing problems', 'motor issues')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">
                        Search Results ({searchResults.length})
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {searchResults.map((report) => (
                        <div
                          key={report.id}
                          className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleReportClick(report)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{report.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {report.summary}
                              </p>
                            </div>
                            {report.similarity_score && (
                              <Badge variant="outline">
                                {(report.similarity_score * 100).toFixed(0)}% match
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Different Views */}
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                <TabsTrigger value="context">Context Example</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="mt-4">
                <HistoricalTimeline
                  reports={allReports}
                  onReportClick={handleReportClick}
                />
              </TabsContent>
              
              <TabsContent value="context" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HistoricalContextPanel
                    entityType="equipment"
                    entityId="SP-001"
                    onReportClick={handleReportClick}
                  />
                  <HistoricalContextPanel
                    entityType="equipment"
                    entityId="IS-042"
                    onReportClick={handleReportClick}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <ReportDetailsDialog
        report={selectedReport}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default HistoricalIntelligenceDemo;
