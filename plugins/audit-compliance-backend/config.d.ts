export interface Config {
  auditCompliance: {
    roverUsername: string;
    /**
     * The roverPassword to used for authenticated requests to rover api
     * @visibility secret
     */
    roverPassword: string;
    roverBaseUrl: string;
  };
}
