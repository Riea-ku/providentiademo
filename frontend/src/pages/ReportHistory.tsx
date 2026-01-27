import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  FileText,
  Calendar,
  Filter,
  Download,
  Eye,
  Archive,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { historicalSystem } from '@/lib/historicalContext';

const ReportHistoryBrowser = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    reportTypes: [],
    equipmentIds: [],
    sortBy: 'relevance'
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Get all reports
      const backend_url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backend_url}/api/reports?limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchReports = async () => {
    if (!searchQuery.trim()) {
      loadReports();
      return;
    }

    try {
      setLoading(true);
      const results = await historicalSystem.searchHistoricalReports(searchQuery, filters);
      
      if (results.success) {
        setReports(results.reports || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchReports();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'dispatched':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      generated: 'secondary',
      dispatched: 'default',
      archived: 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <Header />
        
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              Report History
            </h1>
            <p className="text-muted-foreground mt-1">
              Search and browse all historical reports with AI-powered insights
            </p>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports... (e.g., 'bearing failure', 'pump-001', 'last month')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
                <Button onClick={searchReports} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          {reports.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Sort: {filters.sortBy}
                </Button>
              </div>
            </div>
          )}

          {/* Reports List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                <p className="text-muted-foreground">Searching reports...</p>
              </div>
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card 
                  key={report.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(report.status)}
                          <h3 className="font-semibold text-lg">
                            {report.content?.report_id || report.id}
                          </h3>
                          {getStatusBadge(report.status)}
                        </div>

                        {/* Executive Summary */}
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {report.content?.executive_summary || 
                           report.ai_metadata?.summary ||
                           'No summary available'}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </div>
                          
                          {report.content?.equipment_overview && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Equipment: {report.content.equipment_overview?.split(' ')[0]}
                            </div>
                          )}

                          {report.relevance_score && (
                            <Badge variant="secondary" className="text-xs">
                              Relevance: {report.relevance_score.toFixed(1)}
                            </Badge>
                          )}

                          {report.ai_insight && (
                            <span className="text-xs text-primary">
                              {report.ai_insight}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {report.ai_metadata?.tags && report.ai_metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {report.ai_metadata.tags.slice(0, 5).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-semibold mb-2">No Reports Found</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchQuery 
                    ? `No reports match your search query "${searchQuery}". Try different keywords.`
                    : 'No reports have been generated yet. Run simulations to create reports.'}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      loadReports();
                    }}
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          {reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{reports.length}</p>
                    <p className="text-xs text-muted-foreground">Total Reports</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {reports.filter(r => r.status === 'dispatched').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Dispatched</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {reports.filter(r => r.status === 'generated').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Generated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {reports.filter(r => r.status === 'archived').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Archived</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportHistoryBrowser;
