import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Circle } from 'lucide-react';
import { HistoricalReport } from '@/services/historicalService';
import { format, formatDistanceToNow } from 'date-fns';

interface HistoricalTimelineProps {
  reports: HistoricalReport[];
  onReportClick?: (report: HistoricalReport) => void;
}

export function HistoricalTimeline({
  reports,
  onReportClick,
}: HistoricalTimelineProps) {
  // Sort reports by date (newest first)
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'failure_analysis':
        return 'border-red-500 bg-red-500/10';
      case 'maintenance':
        return 'border-blue-500 bg-blue-500/10';
      case 'investigation':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  if (sortedReports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            No historical events to display
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
          Timeline
          <Badge variant="outline" className="ml-auto">
            {sortedReports.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

            {sortedReports.map((report, index) => (
              <div key={report.id} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2 w-4 h-4 rounded-full border-2 ${getTypeColor(
                    report.report_type
                  )}`}
                >
                  <Circle className="h-2 w-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Content */}
                <div
                  className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onReportClick?.(report)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium">{report.title}</h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {report.report_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {report.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    <span className="ml-auto">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {report.tags && report.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {report.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
