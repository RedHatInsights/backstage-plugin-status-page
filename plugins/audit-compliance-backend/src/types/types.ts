/**
 * Interface representing a Rover data item for access reviews.
 * Contains information about user or service account access to an application.
 */
export interface RoverDataItem {
  /** Name of the application */
  app_name: string;
  /** Environment (e.g., 'production', 'staging') */
  environment: string;
  /** Service account identifier if applicable */
  service_account?: string;
  /** User ID if applicable */
  user_id?: string;
  /** Full name of the user */
  full_name?: string;
  /** Role of the user in the application */
  user_role: string;
  /** Manager of the user */
  manager: string;
  /** Application delegate */
  app_delegate?: string;
  /** Source of the data (e.g., 'rover') */
  source: string;
  /** Account name in the source system */
  account_name: string;
  /** Review period (e.g., '2024') */
  period: string;
  /** Review frequency (e.g., 'quarterly', 'annual') */
  frequency: string;
}

/**
 * Interface representing a GitLab data item for access reviews.
 * Contains information about user access to GitLab projects.
 */
export interface GitLabDataItem {
  /** Environment (e.g., 'production', 'staging') */
  environment: string;
  /** Full name of the user */
  full_name: string;
  /** User ID in GitLab */
  user_id: string;
  /** Role of the user in the project */
  user_role: string;
  /** Manager of the user */
  manager: string;
  /** Source of the data (e.g., 'gitlab') */
  source: string;
  /** Account name in GitLab */
  account_name: string;
  /** Name of the application */
  app_name: string;
  /** Review frequency (e.g., 'quarterly', 'annual') */
  frequency: string;
  /** Review period (e.g., '2024') */
  period: string;
  /** Application delegate */
  app_delegate?: string;
}

/**
 * Interface representing the result of a fresh data sync operation.
 * Contains statistics about the sync operation for both Rover and GitLab data.
 */
export interface SyncFreshDataResult {
  /** Success message */
  message: string;
  /** Statistics about the sync operation */
  statistics: {
    /** Rover-specific statistics */
    rover: {
      /** Number of service accounts synced */
      service_accounts: number;
      /** Number of group access records synced */
      group_access: number;
      /** Total number of Rover records synced */
      total: number;
    };
    /** GitLab-specific statistics */
    gitlab: {
      /** Number of group access records synced */
      group_access: number;
      /** Total number of GitLab records synced */
      total: number;
    };
    /** Total number of records synced across all sources */
    total_records: number;
  };
}
