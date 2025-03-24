export interface Config {
  workstream?: {
    /**
     * A flag to enable/disable plugin and module directly.
     * @visibility frontend
     */
    enabled: boolean;
    /**
     * Override workstream roles with custom roles
     * @deepVisibility frontend
     */
    workstreamRoles?: {
      [key: string]: string;
    };
  };
}
