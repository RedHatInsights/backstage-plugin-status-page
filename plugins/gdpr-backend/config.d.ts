export interface Config {
  gdpr: {
    [key: string]: {
      apiBaseUrl?: string;
      serviceAccount: string;
      token: string;
    };
  };
}
