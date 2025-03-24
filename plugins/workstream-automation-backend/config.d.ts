export interface Config {
  integrations?: {
    /**
     * Integration config for workstream automation plugin
     */
    workstreams?: Array<{
      /**
       * Host name of the endpoint
       */
      host: string;
      /**
       * Base api endpoint for the specified host
       */
      apiBaseUrl: string;
      /**
       * Token used for authentication. Bearer + <token>
       */
      token: string;
      /**
       * Configurtion options for workstream host
       */
      config: {
        /**
         * Default namespace to use when creating entities
         */
        namespace: string;
      };
    }>;
  };
}
