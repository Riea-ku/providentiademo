import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Tag, FileText } from 'lucide-react';
import { HistoricalReport } from '@/services/historicalService';
import { format } from 'date-fns';

interface ReportDetailsDialogProps {
  report: HistoricalReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailsDialog({
  report,
  open,
  onOpenChange,
}: ReportDetailsDialogProps) {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">{report.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {report.generated_by}
            </span>
            {report.accessed_count !== undefined && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Accessed {report.accessed_count} times
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground">{report.summary}</p>
            </div>

            <Separator />

            {/* Tags */}
            {report.tags && report.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Content */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Details</h3>
              {report.content && typeof report.content === 'object' ? (
                <div className="space-y-3">
                  {Object.entries(report.content).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {Array.isArray(value)
                          ? value.join(', ')
                          : typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </span>
                    </div>
                  ))}

                  {/* Recommendations */}
                  {report.content.recommendations &&
                    Array.isArray(report.content.recommendations) && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {report.content.recommendations.map(
                            (rec: string, idx: number) => (
                              <li key={idx}>{rec}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {String(report.content)}
                </p>
              )}
            </div>

            {/* AI Metadata */}
            {report.ai_metadata &&
              Object.keys(report.ai_metadata).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">AI Insights</h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {report.ai_metadata.content_summary && (
                        <p>{report.ai_metadata.content_summary}</p>
                      )}
                      {report.ai_metadata.embedding_model && (
                        <p>
                          <span className="font-medium">Embedding Model:</span>{' '}
                          {report.ai_metadata.embedding_model}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Similarity Score */}
            {report.similarity_score !== undefined && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Relevance</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${report.similarity_score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(report.similarity_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
