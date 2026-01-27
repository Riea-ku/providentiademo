/**
 * Historical Intelligence Service
 * Provides access to historical reports, events, and context
 */

const API_URL = import.meta.env.VITE_BACKEND_URL;

export interface HistoricalReport {
  id: string;
  title: string;
  summary: string;
  content: any;
  report_type: string;
  generated_by: string;
  ai_metadata: any;
  tags: string[];
  reference_entities: any;
  created_at: string;
  similarity_score?: number;
  accessed_count?: number;
}

export interface HistoricalContext {
  entity_type: string;
  entity_id: string;
  reports: HistoricalReport[];
  events: any[];
  summary: string;
}

export interface SearchFilters {
  equipment_id?: string;
  date_range?: { start: string; end: string };
  report_type?: string;
}

class HistoricalService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if historical intelligence system is operational
   */
  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/historical/status`);
      if (!response.ok) throw new Error('Failed to get status');
      return await response.json();
    } catch (error) {
      console.error('Historical status check failed:', error);
      return { success: false, status: 'unavailable' };
    }
  }

  /**
   * Search reports using semantic search
   */
  async searchReports(
    query: string,
    filters: SearchFilters = {},
    limit: number = 10
  ): Promise<HistoricalReport[]> {
    try {
      const response = await fetch(`${API_URL}/api/reports/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters, limit }),
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      return data.reports || [];
    } catch (error) {
      console.error('Report search failed:', error);
      return [];
    }
  }

  /**
   * Get historical context for an entity
   */
  async getHistoricalContext(
    entityType: string,
    entityId: string
  ): Promise<HistoricalContext | null> {
    const cacheKey = `context:${entityType}:${entityId}`;
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_URL}/api/historical/context/${entityType}/${entityId}`
      );

      if (!response.ok) throw new Error('Failed to get context');
      
      const data = await response.json();
      
      if (data.success) {
        this.setCache(cacheKey, data, this.DEFAULT_TTL);
        return data as HistoricalContext;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get historical context:', error);
      return null;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<HistoricalReport | null> {
    try {
      // Use search endpoint with empty query to get all, then filter
      const reports = await this.searchReports('', {}, 100);
      return reports.find(r => r.id === reportId) || null;
    } catch (error) {
      console.error('Failed to get report:', error);
      return null;
    }
  }

  /**
   * Get equipment history
   */
  async getEquipmentHistory(equipmentId: string): Promise<HistoricalReport[]> {
    const context = await this.getHistoricalContext('equipment', equipmentId);
    return context?.reports || [];
  }

  /**
   * Get prediction history
   */
  async getPredictionHistory(predictionId: string): Promise<HistoricalReport[]> {
    const context = await this.getHistoricalContext('prediction', predictionId);
    return context?.reports || [];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
}

export const historicalService = new HistoricalService();
