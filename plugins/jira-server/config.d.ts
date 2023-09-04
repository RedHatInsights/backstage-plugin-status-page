export interface Config {
  jira?: {
    /**
     * The proxy path for Jira.
     * Should be used if proxy is in use for security etc purposes.
     * @visibility frontend
     */
    proxyPath?: string;

    /**
     * In case Confluence is also used, when filtering by component
     * the activities from there would also appear, add this config to
     * remove all those occurrences from the Activity Stream.
     * @visibility frontend
     */
    confluenceActivityFilter?: string;

    /**
     * The verison of the Jira API
     * Should be used if you do not want to use the latest Jira API.
     * @visibility frontend
     */
    apiVersion?: number;
  };
}
