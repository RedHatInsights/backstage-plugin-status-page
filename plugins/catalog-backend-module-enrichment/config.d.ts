export interface Config {
  catalog?: {
    /**
     * Configuration options for the enrichment data processor
     */
    enrichment?: {
      /**
       * Flag to enable/disable the enrichment processor
       */
      enabled?: boolean;
      /**
       * Only process the enrichment data for the specified kinds
       * 
       * Default is: `["Component", "System"]`
       */
      allowedKinds?: string[];
    }
  }
}
