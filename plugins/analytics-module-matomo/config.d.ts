export interface Config {
  app: {
    analytics: {
      matomo: {
        /**
         * Matomo instance url
         * @visibility frontend
         */
        instanceUrl: string;

        /**
         * Matomo siteId
         * @visibility frontend
         */
        siteId: string;
      };
    };
  };
}
