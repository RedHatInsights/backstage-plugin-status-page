export interface Config {
  auditCompliance: {
    roverUsername: string;
    /**
     * The roverPassword to used for authenticated requests to rover api
     * @visibility secret
     */
    roverPassword: string;
    roverBaseUrl: string;
    jiraUrl: string;
    /**
     * The jiraToken to used for authenticated requests to jira api
     * @visibility secret
     */
    jiraToken: string;
    /**
     * The gitlabToken to used for authenticated requests to gitlab api
     * @visibility secret
     */
    gitlabToken: string;
    gitlabBaseUrl: string;
    email: {
      host: string;
      port: number;
      secure: boolean;
      from: string;
      caCert: string;
    };
  };
}
