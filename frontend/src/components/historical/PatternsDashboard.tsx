import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  AlertTriangle,
  Tag,
  Calendar,
  Activity,
  Loader2,
  BarChart3,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL;

interface PatternData {
  time_period: string;
  total_reports: number;
  failure_patterns: any;
  tag_patterns: any;
  temporal_patterns: any;
  insights: string[];
}

export function PatternsDashboard() {
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('365d');

  useEffect(() => {
    loadPatterns();
  }, [timePeriod]);

  const loadPatterns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/patterns/analyze?time_period=${timePeriod}`);
      const data = await response.json();
      if (data.success) {
        setPatterns(data);
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!patterns) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load patterns
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Patterns Overview
          </CardTitle>
          <CardDescription>
            Analyzing {patterns.total_reports} reports over {patterns.time_period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Insights */}
          {patterns.insights && patterns.insights.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Key Insights
              </h3>
              {patterns.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="mt-0.5">{idx + 1}</Badge>
                  <p className="text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Patterns */}
      <Tabs defaultValue="failures" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="failures">Failures</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="temporal">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="failures">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Failure Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patterns.failure_patterns?.most_common && patterns.failure_patterns.most_common.length > 0 ? (
                <div className="space-y-3">
                  {patterns.failure_patterns.most_common.map((failure: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{idx + 1}</Badge>
                        <span className="text-sm font-medium">{failure.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{failure.count} occurrences</Badge>
                        <div className="w-24 h-2 bg-secondary rounded-full">
                          <div
                            className="h-full bg-destructive rounded-full"
                            style={{
                              width: `${(failure.count / patterns.failure_patterns.total_failures) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Total: {patterns.failure_patterns.total_failures} failures across{' '}
                      {patterns.failure_patterns.unique_types} types
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No failure patterns detected</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tag Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patterns.tag_patterns?.most_common_tags && patterns.tag_patterns.most_common_tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patterns.tag_patterns.most_common_tags.map((tag: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {tag.tag}
                      <span className="ml-2 text-xs opacity-70">×{tag.count}</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Temporal Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patterns.temporal_patterns?.reports_by_month ? (
                <div className="space-y-2">
                  {Object.entries(patterns.temporal_patterns.reports_by_month).map(
                    ([month, count]: [string, any]) => (
                      <div key={month} className="flex items-center justify-between">
                        <span className="text-sm">{month}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{count}</Badge>
                          <div className="w-32 h-2 bg-secondary rounded-full">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(count / Math.max(...Object.values(patterns.temporal_patterns.reports_by_month))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  {patterns.temporal_patterns.avg_per_month && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Average: {patterns.temporal_patterns.avg_per_month.toFixed(1)} reports per month
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No temporal patterns available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
