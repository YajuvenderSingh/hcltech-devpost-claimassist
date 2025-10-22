// Centralized data store for efficient API management
class DataStore {
  private dashboardCache: {[key: string]: any} = {};
  private entitiesCache: {[key: string]: any} = {};
  private urlCache: {[key: string]: string} = {};
  private loadingStates: {[key: string]: boolean} = {};
  private subscribers: {[key: string]: Function[]} = {};

  // Dashboard data management
  async getDashboardData(docIds: string[]): Promise<{[key: string]: any}> {
    const results: {[key: string]: any} = {};
    const toFetch: string[] = [];

    // Check cache first (only for completed processing)
    docIds.forEach(docId => {
      const cachedData = this.dashboardCache[docId];
      if (cachedData) {
        const isProcessingComplete = cachedData.classification_status === "Completed" && 
                                   cachedData.extraction_status === "Completed" && 
                                   cachedData.entity_extraction_status === "Completed";
        
        if (isProcessingComplete) {
          results[docId] = cachedData;
        } else {
          // Don't use cache for documents still processing
          toFetch.push(docId);
        }
      } else {
        toFetch.push(docId);
      }
    });

    // Fetch missing data in parallel
    if (toFetch.length > 0) {
      const promises = toFetch.map(async (docId) => {
        if (this.loadingStates[`dashboard_${docId}`]) return;
        
        this.loadingStates[`dashboard_${docId}`] = true;
        try {
          const { fetchDashboardStatus } = await import('./awsService');
          const response = await fetchDashboardStatus(docId);
          
          if (response?.statusCode === 200) {
            const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            
            // Only cache if processing is complete, otherwise always fetch fresh data
            const isProcessingComplete = data.classification_status === "Completed" && 
                                       data.extraction_status === "Completed" && 
                                       data.entity_extraction_status === "Completed";
            
            if (isProcessingComplete) {
              this.dashboardCache[docId] = data;
            }
            
            results[docId] = data;
            this.notifySubscribers(`dashboard_${docId}`, data);
          }
        } catch (error) {
          console.error(`Error fetching dashboard for ${docId}:`, error);
        } finally {
          this.loadingStates[`dashboard_${docId}`] = false;
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  // Entities data management
  async getEntitiesData(docId: string): Promise<any> {
    if (this.entitiesCache[docId]) {
      return this.entitiesCache[docId];
    }

    if (this.loadingStates[`entities_${docId}`]) {
      return null; // Already loading
    }

    this.loadingStates[`entities_${docId}`] = true;
    try {
      const { fetchExtractedEntities } = await import('./awsService');
      const response = await fetchExtractedEntities(docId);
      
      if (response?.statusCode === 200) {
        let responseBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        
        // Handle the same nested structure as ContentExtraction
        if (responseBody && responseBody.extracted_entities) {
          let extractedEntities = responseBody.extracted_entities;
          
          // Parse if it's a string
          if (typeof extractedEntities === 'string') {
            try {
              extractedEntities = JSON.parse(extractedEntities);
            } catch (parseError) {
              console.error('❌ Failed to parse extracted_entities JSON:', parseError);
              return null;
            }
          }
          
          // Return the parsed entities directly
          this.entitiesCache[docId] = extractedEntities;
          this.notifySubscribers(`entities_${docId}`, extractedEntities);
          return extractedEntities;
        }
      }
    } catch (error) {
      console.error(`Error fetching entities for ${docId}:`, error);
    } finally {
      this.loadingStates[`entities_${docId}`] = false;
    }

    return null;
  }

  // URL cache management
  getPreviewUrl(key: string): string | null {
    return this.urlCache[key] || null;
  }

  setPreviewUrl(key: string, url: string): void {
    this.urlCache[key] = url;
  }

  // Subscription system for real-time updates
  subscribe(key: string, callback: Function): () => void {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    this.subscribers[key].push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers[key] = this.subscribers[key].filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(key: string, data: any): void {
    if (this.subscribers[key]) {
      this.subscribers[key].forEach(callback => callback(data));
    }
  }

  // Preload data for better performance
  async preloadData(docIds: string[]): Promise<void> {
    // Preload dashboard data
    this.getDashboardData(docIds);
    
    // Preload entities for first few documents
    const priorityDocs = docIds.slice(0, 3);
    priorityDocs.forEach(docId => {
      this.getEntitiesData(docId);
    });
  }

  // Clear cache when needed
  clearCache(type?: 'dashboard' | 'entities' | 'urls'): void {
    if (!type || type === 'dashboard') this.dashboardCache = {};
    if (!type || type === 'entities') this.entitiesCache = {};
    if (!type || type === 'urls') this.urlCache = {};
  }

  // Get loading state
  isLoading(key: string): boolean {
    return this.loadingStates[key] || false;
  }
}

// Export singleton instance
export const dataStore = new DataStore();
