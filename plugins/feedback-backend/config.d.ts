export interface Config {
  feedback: {
    integrations: {
      /**
       * The list of the jira orgs to consume
       * @visiblity backend
       */
      jira?: Array<{
        host: string;
        /** @visibility secret */
        token: string;
      }>;

      email?: {
        host: string;
        port: number;
        auth?: {
          user?: string;
          /** @visibility secret */
          password?: string;
        };
        secure?: boolean;
        from?: string;
      };
    };
  };
}
