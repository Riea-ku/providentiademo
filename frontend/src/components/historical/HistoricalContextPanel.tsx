import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, FileText, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { historicalService, HistoricalReport } from '@/services/historicalService';
import { formatDistanceToNow } from 'date-fns';

interface HistoricalContextPanelProps {
  entityType: string;
  entityId: string;
  onReportClick?: (report: HistoricalReport) => void;
}

export function HistoricalContextPanel({
  entityType,
  entityId,
  onReportClick,
}: HistoricalContextPanelProps) {
  const [reports, setReports] = useState<HistoricalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistoricalContext();
  }, [entityType, entityId]);

  const loadHistoricalContext = async () => {
    setLoading(true);
    setError(null);

    try {
      const context = await historicalService.getHistoricalContext(entityType, entityId);
      
      if (context) {
        setReports(context.reports);
      } else {
        setReports([]);
      }
    } catch (err) {
      setError('Failed to load historical context');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'failure_analysis':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'investigation':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historical Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading historical data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historical Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Historical Context
          <Badge variant="outline" className="ml-auto">
            {reports.length} reports
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No historical reports found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Reports will appear here as the system learns
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onReportClick?.(report)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getReportIcon(report.report_type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{report.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {report.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {report.report_type.replace('_', ' ')}
                        </Badge>
                        {report.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
