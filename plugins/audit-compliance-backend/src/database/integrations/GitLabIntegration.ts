import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import axios from 'axios';
import { Knex } from 'knex';
import { fetch } from 'undici';

/**
 * Represents a GitLab user with their basic profile information.
 */
interface GitLabUser {
  /** Unique identifier for the user in GitLab */
  id: number;
  /** Username used for login and identification */
  username: string;
  /** Full name of the user */
  name: string;
  /** Email address of the user */
  email: string;
  /** Current state of the user account (e.g., 'active', 'blocked') */
  state: string;
  /** URL to the user's GitLab profile page */
  web_url: string;
}

/**
 * Represents a GitLab project member with their access level and role information.
 */
interface GitLabMember {
  /** Unique identifier for the member in GitLab */
  id: number;
  /** Username of the member */
  username: string;
  /** Full name of the member */
  name: string;
  /** Current state of the member's access (e.g., 'active', 'blocked') */
  state: string;
  /** Numeric access level indicating permissions (10-50) */
  access_level: number;
  /** URL to the member's GitLab profile page */
  web_url: string;
}

/**
 * Represents a GitLab group member with their access level and role information.
 */
interface GitLabGroupMember {
  /** Unique identifier for the member in GitLab */
  id: number;
  /** Username of the member */
  username: string;
  /** Full name of the member */
  name: string;
  /** Current state of the member's access (e.g., 'active', 'blocked') */
  state: string;
  /** Numeric access level indicating permissions (10-50) */
  access_level: number;
  /** URL to the member's GitLab profile page */
  web_url: string;
}

/**
 * Interface representing the response structure for user information from Rover API.
 */
interface UserInfoResponse {
  /** User information result object */
  result?: any;
}

/**
 * Extracts user ID from a Distinguished Name (DN) string.
 *
 * @param dn - Distinguished Name string (e.g., 'uid=user123,dc=example,dc=com')
 * @returns Extracted user ID or null if not found
 */
const extractUid = (dn: string): string | null =>
  dn?.startsWith('uid=') ? dn.split(',')[0].split('=')[1] : null;

/**
 * Standard headers used for GitLab API requests.
 */
const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Backstage-Plugin',
};

/**
 * Interface defining the contract for GitLab integration operations.
 * Provides methods for accessing and managing GitLab project and group data.
 */
export interface GitLabStore {
  /**
   * Retrieves access report for a specific GitLab project or group.
   * @param path - The GitLab project or group path (e.g., 'group/project' or 'group')
   * @returns Promise resolving to array of access records
   */
  getProjectAccessReport(path: string): Promise<any[]>;

  /**
   * Generates and stores GitLab access data for an application.
   * @param appname - Name of the application
   * @param frequency - Review frequency (e.g., 'quarterly', 'annual')
   * @param period - Review period (e.g., '2024')
   * @returns Promise resolving to array of generated access records
   */
  generateGitLabData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]>;

  /**
   * Fetches GitLab data without storing it in the main tables.
   * Used for fresh data synchronization to avoid duplicates.
   * @param appname - Name of the application
   * @param frequency - Review frequency
   * @param period - Review period
   * @returns Promise resolving to array of fetched access records
   */
  fetchGitLabDataForFresh(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]>;
}

/**
 * Main class implementing GitLab integration functionality.
 * Handles GitLab API interactions and data management for access reviews.
 */
export class GitLabDatabase implements GitLabStore {
  private readonly db: Knex;
  private readonly gitlabToken: string;
  private readonly gitlabBaseUrl: string;
  private readonly roverUsername: string;
  private readonly roverPassword: string;
  private readonly roverBaseUrl: string;
  private readonly logger: LoggerService;

  /**
   * Private constructor for GitLabDatabase.
   * Initializes database connection and GitLab configuration.
   *
   * @param knex - Knex database instance
   * @param config - Root configuration service
   * @param logger - Logger service
   */
  private constructor(
    knex: Knex,
    config: RootConfigService,
    logger: LoggerService,
  ) {
    this.db = knex;
    this.logger = logger;
    this.gitlabToken =
      config.getOptionalString('auditCompliance.gitlabToken') || '';
    this.gitlabBaseUrl =
      config.getOptionalString('auditCompliance.gitlabBaseUrl') || '';
    this.roverUsername =
      config.getOptionalString('auditCompliance.roverUsername') || '';
    this.roverPassword =
      config.getOptionalString('auditCompliance.roverPassword') || '';
    this.roverBaseUrl =
      config.getOptionalString('auditCompliance.roverBaseUrl') || '';
  }

  /**
   * Creates a new instance of GitLabDatabase.
   * Factory method for instantiating the database with required dependencies.
   *
   * @param options - Configuration options
   * @param options.knex - Knex database instance
   * @param options.config - Root configuration service
   * @param options.logger - Logger service
   * @returns Promise resolving to a new GitLabDatabase instance
   */
  static async create(options: {
    knex: Knex;
    config: RootConfigService;
    logger: LoggerService;
  }): Promise<GitLabDatabase> {
    const { knex, config, logger } = options;
    return new GitLabDatabase(knex, config, logger);
  }

  /**
   * Generates the authentication header for GitLab API requests.
   *
   * @returns Object containing the PRIVATE-TOKEN header
   */
  private getAuthHeader(): { 'PRIVATE-TOKEN': string } {
    return {
      'PRIVATE-TOKEN': this.gitlabToken,
    };
  }

  /**
   * Generates the authentication header for Rover API requests.
   * Uses Basic authentication with base64 encoded credentials.
   *
   * @returns Object containing the Authorization header
   */
  private getRoverAuthHeader(): { Authorization: string } {
    return {
      Authorization: `Basic ${Buffer.from(
        `${this.roverUsername}:${this.roverPassword}`,
      ).toString('base64')}`,
    };
  }

  /**
   * Fetches user information from the Rover API.
   *
   * @param uid - User ID to fetch information for
   * @returns Promise resolving to user information object or null if not found
   */
  private async getRoverUserInfo(uid: string): Promise<any | null> {
    const url = `${this.roverBaseUrl}/users/${uid}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...headers, ...this.getRoverAuthHeader() },
      });
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as UserInfoResponse;
      return data.result ?? null;
    } catch (e) {
      this.logger.warn(`Failed to fetch Rover user info for UID ${uid}: ${e}`);
      return null;
    }
  }

  /**
   * Determines whether a GitLab path is a project or group by checking both APIs.
   * First tries to find it as a project, then as a group if not found.
   *
   * @param path - The GitLab path to check
   * @returns Promise resolving to 'project', 'group', or 'unknown'
   */
  private async detectGitLabType(
    path: string,
  ): Promise<'project' | 'group' | 'unknown'> {
    try {
      // First try to find it as a project
      const projectUrl = `${
        this.gitlabBaseUrl
      }/api/v4/projects/${encodeURIComponent(path)}`;
      const projectResponse = await axios.get(projectUrl, {
        headers: { ...headers, ...this.getAuthHeader() },
      });

      if (projectResponse.status === 200) {
        return 'project';
      }
    } catch (projectError: any) {
      // Project not found, try as group
      if (projectError.response?.status === 404) {
        try {
          const groupUrl = `${
            this.gitlabBaseUrl
          }/api/v4/groups/${encodeURIComponent(path)}`;
          const groupResponse = await axios.get(groupUrl, {
            headers: { ...headers, ...this.getAuthHeader() },
          });

          if (groupResponse.status === 200) {
            return 'group';
          }
        } catch (groupError: any) {
          if (groupError.response?.status === 404) {
            this.logger.warn(
              `Path ${path} is neither a GitLab project nor group`,
            );
            return 'unknown';
          }
          throw groupError;
        }
      } else {
        throw projectError;
      }
    }

    return 'unknown';
  }

  /**
   * Retrieves all members of a GitLab project, including inherited members.
   *
   * @param projectPath - The GitLab project path
   * @returns Promise resolving to array of GitLabMember objects
   */
  private async getProjectMembers(
    projectPath: string,
  ): Promise<GitLabMember[]> {
    const url = `${this.gitlabBaseUrl}/api/v4/projects/${encodeURIComponent(
      projectPath,
    )}/members/all`;
    try {
      const response = await axios.get(url, {
        headers: { ...headers, ...this.getAuthHeader() },
      });
      return response.data;
    } catch (e) {
      this.logger.warn(
        `Failed to fetch project members for ${projectPath}: ${e}`,
      );
      return [];
    }
  }

  /**
   * Retrieves all members of a GitLab group, including inherited members.
   *
   * @param groupPath - The GitLab group path
   * @returns Promise resolving to array of GitLabGroupMember objects
   */
  private async getGroupMembers(
    groupPath: string,
  ): Promise<GitLabGroupMember[]> {
    const url = `${this.gitlabBaseUrl}/api/v4/groups/${encodeURIComponent(
      groupPath,
    )}/members/all`;
    try {
      const response = await axios.get(url, {
        headers: { ...headers, ...this.getAuthHeader() },
      });
      return response.data;
    } catch (e) {
      this.logger.warn(`Failed to fetch group members for ${groupPath}: ${e}`);
      return [];
    }
  }

  /**
   * Retrieves members from either a GitLab project or group based on the path type.
   *
   * @param path - The GitLab project or group path
   * @returns Promise resolving to array of member objects (GitLabMember or GitLabGroupMember)
   */
  private async getMembers(
    path: string,
  ): Promise<(GitLabMember | GitLabGroupMember)[]> {
    const type = await this.detectGitLabType(path);

    if (type === 'project') {
      return await this.getProjectMembers(path);
    }
    if (type === 'group') {
      return await this.getGroupMembers(path);
    }
    this.logger.warn(`Unknown GitLab type for path: ${path}`);
    return [];
  }

  /**
   * Fetches detailed information about a GitLab user.
   *
   * @param userId - The GitLab user ID
   * @returns Promise resolving to GitLabUser object or null if not found
   */
  private async getUserDetails(userId: number): Promise<GitLabUser | null> {
    const url = `${this.gitlabBaseUrl}/api/v4/users/${userId}`;
    try {
      const response = await axios.get(url, {
        headers: { ...headers, ...this.getAuthHeader() },
      });
      return response.data;
    } catch (e) {
      this.logger.warn(`Failed to fetch user details for ID ${userId}: ${e}`);
      return null;
    }
  }

  /**
   * Converts numeric access level to human-readable role name.
   *
   * @param level - Numeric access level (10-50)
   * @returns String representation of the access level
   */
  private getAccessLevelName(level: number): string {
    switch (level) {
      case 50:
        return 'owner';
      case 40:
        return 'maintainer';
      case 30:
        return 'developer';
      case 20:
        return 'reporter';
      case 10:
        return 'guest';
      default:
        return 'unknown';
    }
  }

  /**
   * Generates and stores an access report for a GitLab project or group.
   * Creates records in the group_access_reports table for each active member.
   *
   * @param path - The GitLab project or group path
   * @returns Promise resolving to array of created access report records
   */
  async getProjectAccessReport(path: string): Promise<any[]> {
    const report: any[] = [];
    const members = await this.getMembers(path);

    // Get app details for this project/group
    const appEntry = await this.db('applications')
      .select('app_name', 'environment', 'app_delegate', 'app_owner')
      .where({ account_name: path, source: 'gitlab' })
      .first();

    if (!appEntry) {
      this.logger.warn(`No application entry found for GitLab path: ${path}`);
      return report;
    }

    for (const member of members) {
      if (member.state !== 'active') continue;

      const userDetails = await this.getUserDetails(member.id);
      if (!userDetails) continue;

      // Fetch manager information from Rover using GitLab username
      let managerName = appEntry.app_owner || 'N/A';
      let managerUid = '';

      try {
        const roverUserInfo = await this.getRoverUserInfo(userDetails.username);
        if (roverUserInfo && roverUserInfo.manager) {
          const managerUidFromRover = extractUid(roverUserInfo.manager);
          if (managerUidFromRover) {
            const managerInfo = await this.getRoverUserInfo(
              managerUidFromRover,
            );
            if (managerInfo) {
              managerName = managerInfo.cn || managerUidFromRover;
              managerUid = managerUidFromRover;
            }
          }
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch manager info for user ${userDetails.username}: ${error}`,
        );
      }

      const row = {
        environment: appEntry.environment || path,
        full_name: userDetails.name,
        user_id: userDetails.username,
        user_role: this.getAccessLevelName(member.access_level),
        manager: managerName,
        manager_uid: managerUid,
        sign_off_status: 'pending',
        sign_off_by: 'N/A',
        sign_off_date: null,
        source: 'gitlab',
        comments: '',
        ticket_reference: '',
        access_change_date: null,
        created_at: new Date(),
        account_name: path,
        app_name: appEntry.app_name,
        frequency: 'quarterly', // Default value, should be updated by the caller
        period: new Date().getFullYear().toString(), // Default value, should be updated by the caller
        app_delegate: appEntry.app_delegate,
        ticket_status: 'pending',
      };

      try {
        await this.db('group_access_reports').insert(row);
        report.push(row);
      } catch (error) {
        this.logger.error(
          `Failed to insert row for user ${userDetails.username}: ${error}`,
        );
      }
    }

    return report;
  }

  /**
   * Generates and stores GitLab access data for an application.
   * Processes all GitLab projects and groups associated with the application and creates access records.
   *
   * @param appname - Name of the application
   * @param frequency - Review frequency (e.g., 'quarterly', 'annual')
   * @param period - Review period (e.g., '2024')
   * @returns Promise resolving to array of generated access records
   * @throws Error if no GitLab data is found for the application
   */
  async generateGitLabData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]> {
    const report: any[] = [];

    try {
      const appEntries = await this.db('applications')
        .select(
          'type',
          'environment',
          'app_delegate',
          'account_name',
          'app_name',
          'app_owner',
          'app_owner_email',
        )
        .where({
          app_name: appname,
          source: 'gitlab',
        });

      if (!appEntries.length) {
        this.logger.error(`No GitLab data found for appname: ${appname}`);
        throw new Error(`No GitLab data found for appname: ${appname}`);
      }

      // --- Optimization: Collect all unique manager usernames ---
      const allManagerUids = new Set<string>();
      const allUserDetails: Record<string, GitLabUser> = {};
      const allRows: any[] = [];

      for (const app of appEntries) {
        const {
          type,
          environment,
          app_delegate,
          app_owner,
          app_owner_email,
          account_name,
          app_name,
        } = app;

        // Check if this is a service account - handle differently
        if (type === 'service-account') {
          // For service accounts, we don't fetch GitLab members - just create the service account entry
          let managerName = app_owner || 'N/A';
          let managerUidFinal = '';

          // Try to get manager info from app_owner_email if app_owner is not available
          if (!app_owner && app_owner_email && app_owner_email.includes('@')) {
            managerName = app_owner_email.split('@')[0];
            managerUidFinal = app_owner_email.split('@')[0];
          }

          // Insert into service_account_access_review table
          const serviceAccountRow = {
            app_name: app_name,
            environment: environment,
            service_account: account_name,
            user_role: 'service-account',
            manager: managerName,
            manager_uid: managerUidFinal,
            sign_off_status: 'pending',
            sign_off_by: 'N/A',
            sign_off_date: null,
            comments: '',
            ticket_reference: '',
            revoked_date: null,
            created_at: new Date(),
            updated_at: new Date(),
            period: period,
            frequency: frequency,
            app_delegate: app_delegate,
            ticket_status: 'pending',
            source: 'gitlab',
          };
          await this.db('service_account_access_review').insert(
            serviceAccountRow,
          );
          report.push(serviceAccountRow);
          continue; // Skip the rest of the loop for service accounts
        }

        // For regular user accounts, fetch GitLab members
        // Use account_name as the GitLab project or group path
        const members = await this.getMembers(account_name);

        if (!members || members.length === 0) {
          this.logger.warn(`No members found for GitLab path: ${account_name}`);
          continue;
        }

        // Fetch all user details in parallel (cache)
        await Promise.all(
          members.map(async member => {
            if (!allUserDetails[member.id]) {
              const details = await this.getUserDetails(member.id);
              if (details) {
                allUserDetails[member.id] = details;
              }
            }
          }),
        );

        for (const member of members) {
          const userDetails = allUserDetails[member.id];
          if (!userDetails) {
            this.logger.warn(
              `Could not fetch details for GitLab user ID: ${member.id}`,
            );
            continue;
          }

          // Get manager info from Rover using GitLab username
          let managerUid = '';
          if (userDetails.username) {
            try {
              const roverUserInfo = await this.getRoverUserInfo(
                userDetails.username,
              );
              if (roverUserInfo && roverUserInfo.manager) {
                const managerUidFromRover = extractUid(roverUserInfo.manager);
                if (managerUidFromRover) {
                  managerUid = managerUidFromRover;
                  allManagerUids.add(managerUidFromRover);
                }
              }
            } catch (error) {
              this.logger.warn(
                `Failed to fetch manager info for user ${userDetails.username}: ${error}`,
              );
            }
          }

          allRows.push({
            type,
            environment,
            full_name: userDetails.name,
            user_id: userDetails.username,
            user_role: this.getAccessLevelName(member.access_level),
            managerUid,
            app_owner,
            app_owner_email,
            account_name,
            app_name,
            period,
            frequency,
            app_delegate,
          });
        }
      }
      // --- Optimization: Fetch all unique manager infos in parallel ---
      const managerInfoCache: Record<string, any> = {};
      await Promise.all(
        Array.from(allManagerUids).map(async uid => {
          managerInfoCache[uid] = await this.getRoverUserInfo(uid);
        }),
      );
      // --- Build final rows and insert ---
      for (const row of allRows) {
        const managerInfo = row.managerUid
          ? managerInfoCache[row.managerUid]
          : null;
        const managerName =
          managerInfo?.cn || row.managerUid || row.app_owner || 'N/A';
        let managerUidFinal = row.managerUid || '';
        if (
          !managerInfo &&
          !row.managerUid &&
          row.app_owner_email &&
          row.app_owner_email.includes('@')
        ) {
          managerUidFinal = row.app_owner_email.split('@')[0];
        }
        const dbRow = {
          environment: row.environment,
          full_name: row.full_name,
          user_id: row.user_id,
          user_role: row.user_role,
          manager: managerName,
          manager_uid: managerUidFinal,
          sign_off_status: 'pending',
          sign_off_by: 'N/A',
          sign_off_date: null,
          source: 'gitlab',
          comments: '',
          ticket_reference: '',
          access_change_date: null,
          created_at: new Date(),
          account_name: row.account_name,
          app_name: row.app_name,
          frequency: row.frequency,
          period: row.period,
          app_delegate: row.app_delegate,
          ticket_status: 'pending',
        };
        await this.db('group_access_reports').insert(dbRow);
        report.push(dbRow);
      }
      this.logger.info(
        `Successfully generated GitLab report with ${report.length} entries`,
      );
      return report;
    } catch (error) {
      this.logger.error(`Error generating GitLab data: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches GitLab data for fresh tables without inserting into main tables.
   * Used by the sync-fresh-data endpoint to avoid duplicate entries.
   *
   * @param appname - Name of the application
   * @param frequency - Review frequency
   * @param period - Review period
   * @returns Promise resolving to array of fetched access records
   * @throws Error if no GitLab data is found for the application
   */
  async fetchGitLabDataForFresh(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]> {
    const report: any[] = [];

    try {
      const appEntries = await this.db('applications')
        .select(
          'type',
          'environment',
          'app_delegate',
          'account_name',
          'app_name',
          'app_owner',
          'app_owner_email',
        )
        .where({
          app_name: appname,
          source: 'gitlab',
        });

      if (!appEntries.length) {
        this.logger.error(`No GitLab data found for appname: ${appname}`);
        throw new Error(`No GitLab data found for appname: ${appname}`);
      }

      for (const app of appEntries) {
        const {
          type,
          environment,
          app_delegate,

          app_owner,
          app_owner_email,
          account_name,
          app_name,
        } = app;

        this.logger.info(
          `Processing GitLab path: ${account_name} for app: ${app_name} with type: ${type}`,
        );

        if (type === 'service-account') {
          // For service accounts, we don't fetch GitLab members - just create the service account entry
          let managerName = app_owner || 'N/A';

          // Try to get manager info from app_owner_email if app_owner is not available
          if (!app_owner && app_owner_email && app_owner_email.includes('@')) {
            managerName = app_owner_email.split('@')[0];
          }

          // Return service account data structure
          const serviceAccountRow = {
            environment,
            service_account: account_name,
            user_role: 'service-account',
            manager: managerName,
            source: 'gitlab',
            account_name: account_name,
            app_name,
            frequency,
            period,
            app_delegate,
          };
          report.push(serviceAccountRow);
          continue; // Skip the rest of the loop for service accounts
        }

        // For regular user accounts, fetch GitLab members
        // Use account_name as the GitLab project or group path
        const members = await this.getMembers(account_name);

        if (!members || members.length === 0) {
          this.logger.warn(`No members found for GitLab path: ${account_name}`);
          continue;
        }

        for (const member of members) {
          if (member.state !== 'active') {
            continue;
          }

          const userDetails = await this.getUserDetails(member.id);
          if (!userDetails) {
            this.logger.warn(
              `Could not fetch details for GitLab user ID: ${member.id}`,
            );
            continue;
          }

          // Get manager info from Rover using GitLab username
          let managerUid = '';
          if (userDetails.username) {
            try {
              const roverUserInfo = await this.getRoverUserInfo(
                userDetails.username,
              );
              if (roverUserInfo && roverUserInfo.manager) {
                const managerUidFromRover = extractUid(roverUserInfo.manager);
                if (managerUidFromRover) {
                  managerUid = managerUidFromRover;
                }
              }
            } catch (error) {
              this.logger.warn(
                `Failed to fetch manager info for user ${userDetails.username}: ${error}`,
              );
            }
          }

          const managerInfo = managerUid
            ? await this.getRoverUserInfo(managerUid)
            : null;

          let managerName = app_owner || 'N/A';
          if (managerInfo) {
            managerName = managerInfo.cn || managerUid;
          } else if (app_owner_email) {
            managerName = app_owner_email.split('@')[0];
          }

          // Return regular user data structure
          const row = {
            environment,
            full_name: userDetails.name,
            user_id: userDetails.username,
            user_role: this.getAccessLevelName(member.access_level),
            manager: managerName,
            manager_uid: managerUid,
            source: 'gitlab',
            account_name: account_name,
            app_name,
            frequency,
            period,
            app_delegate,
            app_owner_email,
          };

          report.push(row);
        }
      }

      this.logger.info(
        `Successfully fetched GitLab data with ${report.length} entries`,
      );
      return report;
    } catch (error) {
      this.logger.error(`Error fetching GitLab data: ${error}`);
      throw error;
    }
  }
}
