// Historical Context System - Client-side service
// Manages historical data fetching and caching

interface HistoricalContext {
  reports: any[];
  events: any[];
  patterns: any;
  summary: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class HistoricalContextSystem {
  private static instance: HistoricalContextSystem;
  private historicalCache = new Map<string, CacheEntry>();
  private backend_url: string;

  constructor() {
    this.backend_url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
  }

  static getInstance(): HistoricalContextSystem {
    if (!HistoricalContextSystem.instance) {
      HistoricalContextSystem.instance = new HistoricalContextSystem();
    }
    return HistoricalContextSystem.instance;
  }

  async getHistoricalContext(entityType: string, entityId: string): Promise<HistoricalContext> {
    const cacheKey = `${entityType}:${entityId}`;

    // Check cache
    if (this.historicalCache.has(cacheKey)) {
      const cached = this.historicalCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    // Fetch from backend with AI enrichment
    try {
      const response = await fetch(
        `${this.backend_url}/api/historical/context/${entityType}/${entityId}`
      );
      const context = await response.json();

      // Cache with expiration
      this.historicalCache.set(cacheKey, {
        data: context,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      });

      return context;
    } catch (error) {
      console.error('Failed to fetch historical context:', error);
      throw error;
    }
  }

  async searchHistoricalReports(query: string, filters: any = {}): Promise<any> {
    try {
      const response = await fetch(`${this.backend_url}/api/reports/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters,
          include_ai_insights: true,
          limit: 20,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to search reports:', error);
      throw error;
    }
  }

  async analyzePatterns(timePeriod: string = '365d'): Promise<any> {
    const cacheKey = `patterns:${timePeriod}`;

    // Check cache
    if (this.historicalCache.has(cacheKey)) {
      const cached = this.historicalCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${this.backend_url}/api/patterns/analyze?time_period=${timePeriod}`
      );
      const patterns = await response.json();

      // Cache for 10 minutes
      this.historicalCache.set(cacheKey, {
        data: patterns,
        timestamp: Date.now(),
        ttl: 10 * 60 * 1000,
      });

      return patterns;
    } catch (error) {
      console.error('Failed to analyze patterns:', error);
      throw error;
    }
  }

  async getEquipmentPatterns(equipmentId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.backend_url}/api/patterns/equipment/${equipmentId}`
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to get equipment patterns:', error);
      throw error;
    }
  }

  async getEventHistory(entityType?: string, entityId?: string, days: number = 30): Promise<any> {
    try {
      let url = `${this.backend_url}/api/historical/events?days=${days}`;
      if (entityType && entityId) {
        url += `&entity_type=${entityType}&entity_id=${entityId}`;
      }

      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Failed to get event history:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.historicalCache.clear();
  }

  // Helper method for components to use
  async loadEquipmentHistory(equipmentId: string): Promise<any> {
    const context = await this.getHistoricalContext('equipment', equipmentId);

    return {
      reports: context.reports || [],
      predictions: (context.events || []).filter((e: any) => e.event_type === 'prediction_created'),
      workOrders: (context.events || []).filter((e: any) => e.event_type === 'work_order_created'),
      maintenancePatterns: context.patterns,
      aiInsights: context.patterns?.recommended_action || 'No insights available',
      summary: context.summary,
    };
  }
}

// Export singleton instance
export const historicalSystem = HistoricalContextSystem.getInstance();

// Helper hooks for React components
export const useHistoricalContext = (entityType: string, entityId: string) => {
  const [context, setContext] = React.useState<HistoricalContext | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!entityType || !entityId) return;

    const fetchContext = async () => {
      try {
        setLoading(true);
        const data = await historicalSystem.getHistoricalContext(entityType, entityId);
        setContext(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [entityType, entityId]);

  return { context, loading, error };
};
