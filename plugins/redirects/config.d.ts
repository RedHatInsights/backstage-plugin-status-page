export interface Config {
  app: {
    /**
     * @deepVisibility frontend
     */
    redirects?: {
      rules: Array<{
        /**
         * The type of redirection rule.
         * 
         * `url`: plain url redirection for the `from` url
         * 
         * `entity`: redirections for catalog and techdocs pages for entityRef in `from`
         */
        type: 'url' | 'entity';

        /**
         * The url / entityRef from which the user should be navigated from.
         * 
         * The entityRef (`kind:namespace/name`) applies redirection to the catalog entity page as well as techdocs pages
         */
        from: string;

        /**
         * The url / entityRef to which the user should be navigated to.
         * 
         * For an entityRef (`kind:namespace/name`), the user is navigated to the same page as the original page, but for the `to` entity.
         */
        to: string;

        /**
         * _(optional)_ A custom error message.
         * 
         * Overrides the default error message.
         */
        message?: string;
      }>;
    };
  }
}
