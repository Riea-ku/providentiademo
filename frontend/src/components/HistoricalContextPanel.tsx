import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History,
  FileText,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface HistoricalContextPanelProps {
  entityType: string;
  entityId: string;
  context: any;
  onViewReport?: (reportId: string) => void;
  onViewAllHistory?: () => void;
}

const HistoricalContextPanel: React.FC<HistoricalContextPanelProps> = ({
  entityType,
  entityId,
  context,
  onViewReport,
  onViewAllHistory
}) => {
  if (!context) {
    return null;
  }

  const { reports = [], events = [], patterns, summary } = context;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-5 h-5 text-primary" />
          Historical Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm">{summary}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold">{reports.length}</p>
            <p className="text-xs text-muted-foreground">Historical Reports</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground">Recorded Events</p>
          </div>
        </div>

        {/* Equipment Patterns (if available) */}
        {patterns && patterns.total_failures !== undefined && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pattern Analysis
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Failures</span>
                <Badge variant={patterns.total_failures > 5 ? 'destructive' : 'secondary'}>
                  {patterns.total_failures}
                </Badge>
              </div>
              
              {patterns.avg_cost_per_failure && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Cost/Failure</span>
                  <span className="font-semibold">
                    ${patterns.avg_cost_per_failure.toLocaleString()}
                  </span>
                </div>
              )}

              {patterns.optimal_maintenance_interval_days && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Maintenance Interval</span>
                  <span className="font-semibold">
                    {patterns.optimal_maintenance_interval_days.toFixed(0)} days
                  </span>
                </div>
              )}

              {patterns.recommended_action && (
                <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20 mt-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {patterns.recommended_action}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Reports */}
        {reports.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Recent Reports ({reports.length})
            </h4>
            <div className="space-y-2">
              {reports.slice(0, 3).map((report: any) => (
                <div
                  key={report.id}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer text-xs"
                  onClick={() => onViewReport && onViewReport(report.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium line-clamp-1">
                      {report.content?.report_id || report.id?.slice(0, 16)}
                    </span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-1">
                    {report.ai_metadata?.summary || report.content?.executive_summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        {events.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recent Events ({events.length})
            </h4>
            <div className="space-y-1">
              {events.slice(0, 3).map((event: any, idx: number) => (
                <div key={idx} className="p-2 rounded bg-muted text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {event.event_type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        {(reports.length > 3 || events.length > 3) && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewAllHistory}
          >
            View Complete History
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {/* No Data State */}
        {reports.length === 0 && events.length === 0 && !patterns && (
          <div className="text-center py-6">
            <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No historical data available yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalContextPanel;
