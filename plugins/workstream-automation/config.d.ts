export interface Config {
  workstream?: {
    /**
     * Override workstream roles with custom roles
     * @deepVisibility frontend
     */
    workstreamRoles?: {
      [key: string]: string;
    };
  };
}
