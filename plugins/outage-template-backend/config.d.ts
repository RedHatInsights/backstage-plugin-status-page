export interface Config {
  outageService: {
    statusPageUrl: string;
    /**
     * @visibility secret
     */
    statusPageAuthToken: string;
  };
}
