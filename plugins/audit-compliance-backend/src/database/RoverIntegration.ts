import {
  RootConfigService,
  resolvePackagePath,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { fetch } from 'undici';

/**
 * Interface representing the response structure for user information from Rover API.
 */
interface UserInfoResponse {
  /** User information result object */
  result?: any;
}

/**
 * Interface representing group membership information from Rover API.
 */
interface GroupInfo {
  /** Array of member user IDs */
  memberUids?: string[];
  /** Array of owner user IDs */
  ownerUids?: string[];
}

/**
 * Interface representing the response structure for group information from Rover API.
 */
interface GroupApiResponse {
  result?: {
    /** Array of group information objects */
    result?: GroupInfo[];
  };
}

/**
 * Path to database migrations directory.
 */
const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-audit-compliance-backend',
  'migrations',
);

/**
 * Standard headers used for Rover API requests.
 */
const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Backstage-Plugin',
};

/**
 * Extracts user ID from a Distinguished Name (DN) string.
 *
 * @param dn - Distinguished Name string (e.g., 'uid=user123,dc=example,dc=com')
 * @returns Extracted user ID or null if not found
 */
const extractUid = (dn: string): string | null =>
  dn?.startsWith('uid=') ? dn.split(',')[0].split('=')[1] : null;

/**
 * Interface defining the contract for Rover integration operations.
 * Provides methods for accessing and managing Rover group data.
 */
export interface RoverStore {
  /**
   * Retrieves access report for a specific Rover group.
   * @param groupCn - The Rover group common name
   * @returns Promise resolving to array of group access records
   */
  getGroupAccessReport(groupCn: string): Promise<any[]>;

  /**
   * Generates and stores Rover access data for an application.
   * @param appname - Name of the application
   * @param frequency - Review frequency (e.g., 'quarterly', 'annual')
   * @param period - Review period (e.g., '2024')
   * @returns Promise resolving to array of generated access records
   */
  generateRoverData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]>;

  /**
   * Fetches Rover data without storing it in the main tables.
   * Used for fresh data synchronization to avoid duplicates.
   * @param appname - Name of the application
   * @param frequency - Review frequency
   * @param period - Review period
   * @returns Promise resolving to array of fetched access records
   */
  fetchRoverDataForFresh(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]>;
}

/**
 * Main class implementing Rover integration functionality.
 * Handles Rover API interactions and data management for access reviews.
 */
export class RoverDatabase implements RoverStore {
  private readonly db: Knex;
  private readonly roverUsername: string;
  private readonly roverPassword: string;
  private readonly roverBaseUrl: string;
  private readonly logger: LoggerService;

  /**
   * Private constructor for RoverDatabase.
   * Initializes database connection and Rover configuration.
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
    this.roverUsername =
      config.getOptionalString('auditCompliance.roverUsername') || '';
    this.roverPassword =
      config.getOptionalString('auditCompliance.roverPassword') || '';
    this.roverBaseUrl =
      config.getOptionalString('auditCompliance.roverBaseUrl') || '';
  }

  /**
   * Creates a new instance of RoverDatabase.
   * Factory method for instantiating the database with required dependencies.
   * Optionally runs database migrations.
   *
   * @param options - Configuration options
   * @param options.knex - Knex database instance
   * @param options.config - Root configuration service
   * @param options.logger - Logger service
   * @param options.skipMigrations - Whether to skip running migrations
   * @returns Promise resolving to a new RoverDatabase instance
   */
  static async create(options: {
    knex: Knex;
    config: RootConfigService;
    logger: LoggerService;
    skipMigrations?: boolean;
  }): Promise<RoverDatabase> {
    const { knex, config, logger, skipMigrations = false } = options;

    if (!skipMigrations) {
      await knex.migrate.latest({ directory: migrationsDir });
    }

    return new RoverDatabase(knex, config, logger);
  }

  /**
   * Generates the authentication header for Rover API requests.
   * Uses Basic authentication with base64 encoded credentials.
   *
   * @returns Object containing the Authorization header
   */
  private getAuthHeader(): { Authorization: string } {
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
  private async getUserInfo(uid: string): Promise<any | null> {
    const url = `${this.roverBaseUrl}/users/${uid}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...headers, ...this.getAuthHeader() },
      });
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as UserInfoResponse;
      return data.result ?? null;
    } catch (e) {
      this.logger.warn(`Failed to fetch user info for UID ${uid}: ${e}`);
      return null;
    }
  }

  /**
   * Generates and stores an access report for a Rover group.
   * Creates records in the group_access_reports table for each group member.
   *
   * @param groupCn - The Rover group common name
   * @returns Promise resolving to array of created access report records
   */
  async getGroupAccessReport(groupCn: string): Promise<any[]> {
    const report: any[] = [];

    const { memberUids, ownerUids } = await this.getGroupMembersAndOwners(
      groupCn,
    );
    const allUids = Array.from(new Set([...memberUids, ...ownerUids]));

    for (const uid of allUids) {
      const user = await this.getUserInfo(uid);
      if (!user) continue;

      let role = 'N/A';
      if (memberUids.includes(uid) && ownerUids.includes(uid))
        role = 'owner, member';
      else if (memberUids.includes(uid)) role = 'member';
      else if (ownerUids.includes(uid)) role = 'owner';

      const managerUid = extractUid(user.manager || '');
      const managerInfo = managerUid
        ? await this.getUserInfo(managerUid)
        : null;
      const managerName = managerInfo?.cn || managerUid || '';

      const row = {
        environment: groupCn,
        full_name: user.cn,
        user_id: user.uid,
        user_role: role,
        manager: managerName,
        manager_uid: managerUid || '',
        sign_off_status: 'pending',
        sign_off_by: 'N/A',
        sign_off_date: null,
        source: 'rover',
        comments: '',
        ticket_reference: '',
        access_change_date: null,
        created_at: new Date(),
      };

      await this.db('group_access_reports').insert(row);
      report.push(row);
    }

    return report;
  }

  /**
   * Retrieves members and owners of a Rover group.
   *
   * @param groupCn - The Rover group common name
   * @returns Promise resolving to object containing arrays of member and owner UIDs
   */
  private async getGroupMembersAndOwners(groupCn: string): Promise<{
    memberUids: string[];
    ownerUids: string[];
  }> {
    const url = `${this.roverBaseUrl}/groups?criteria=${groupCn}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...headers, ...this.getAuthHeader() },
      });

      const data = (await response.json()) as GroupApiResponse;
      const groupInfo = data?.result?.result?.[0];

      if (!groupInfo) return { memberUids: [], ownerUids: [] };

      const memberUids = (groupInfo.memberUids || [])
        .map(extractUid)
        .filter(Boolean) as string[];
      const ownerUids = (groupInfo.ownerUids || [])
        .map(extractUid)
        .filter(Boolean) as string[];

      return { memberUids, ownerUids };
    } catch (e) {
      this.logger.warn(
        `Failed to fetch group members/owners for ${groupCn}: ${e}`,
      );
      return { memberUids: [], ownerUids: [] };
    }
  }

  /**
   * Generates and stores Rover access data for an application.
   * Processes all Rover groups associated with the application and creates access records.
   * Handles both regular groups and service accounts.
   *
   * @param appname - Name of the application
   * @param frequency - Review frequency (e.g., 'quarterly', 'annual')
   * @param period - Review period (e.g., '2024')
   * @returns Promise resolving to array of generated access records
   * @throws Error if no Rover data is found for the application
   */
  async generateRoverData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]> {
    const report: any[] = [];

    const appEntries = await this.db('applications')
      .select(
        'type',
        'environment',
        'app_delegate',
        'account_name',
        'app_name',
        'app_owner',
      )
      .where({
        app_name: appname,
        source: 'rover',
      });

    if (!appEntries.length) {
      throw new Error(`No rover data found for appname: ${appname}`);
    }

    for (const app of appEntries) {
      const {
        type,
        environment,
        app_delegate,
        account_name,
        app_name,
        app_owner,
      } = app;

      const rover_group_name = account_name;

      if (type === 'rover-group-name') {
        const { memberUids, ownerUids } = await this.getGroupMembersAndOwners(
          rover_group_name,
        );

        const allUids = Array.from(new Set([...memberUids, ...ownerUids]));

        if (allUids.length === 0) {
          this.logger.warn(
            `No members or owners found for group: ${rover_group_name}`,
          );
          continue;
        }

        for (const uid of allUids) {
          const user = await this.getUserInfo(uid);
          if (!user) continue;

          let role = 'N/A';
          if (memberUids.includes(uid) && ownerUids.includes(uid))
            role = 'owner, member';
          else if (memberUids.includes(uid)) role = 'member';
          else if (ownerUids.includes(uid)) role = 'owner';

          const managerUid = extractUid(user.manager || '');
          const managerInfo = managerUid
            ? await this.getUserInfo(managerUid)
            : null;
          const managerName = managerInfo?.cn || managerUid || app_owner || '';
       
          const row = {
            environment,
            full_name: user.cn,
            user_id: user.uid,
            user_role: role,
            manager: managerName,
            manager_uid: managerUid || '',
            sign_off_status: 'pending',
            sign_off_by: 'N/A',
            sign_off_date: null,
            source: 'rover',
            comments: '',
            ticket_reference: '',
            access_change_date: null,
            created_at: new Date(),
            account_name: rover_group_name,
            app_name,
            frequency,
            period,
            app_delegate,
            ticket_status: 'pending',
          };

          await this.db('group_access_reports').insert(row);
          report.push(row);
        }
      } else if (type === 'service-account') {
        // For service accounts, fetch the service account info from Rover to get manager UID
        const serviceAccountInfo = await this.getUserInfo(rover_group_name);
        let managerUid = '';
        let managerName = app_owner || '';

        if (serviceAccountInfo && serviceAccountInfo.manager) {
          managerUid = extractUid(serviceAccountInfo.manager) || '';
          if (managerUid) {
            const managerInfo = await this.getUserInfo(managerUid);
            managerName = managerInfo?.cn || managerUid || app_owner || '';
          }
        }

        // Fetch source from applications table
        const applicationData = await this.db('applications')
          .select('source')
          .where({
            account_name: rover_group_name,
            app_name: app_name,
          })
          .first();

        const source = applicationData?.source || 'rover';
        const row = {
          app_name,
          environment,
          service_account: rover_group_name,
          user_role: 'service-account',
          manager: managerName,
          manager_uid: managerUid,
          sign_off_status: 'Pending',
          sign_off_by: 'N/A',
          sign_off_date: null,
          comments: '',
          ticket_reference: '',
          revoked_date: null,
          created_at: new Date(),
          updated_at: new Date(),
          period,
          frequency,
          app_delegate,
          ticket_status: '',
          source,
        };

        await this.db('service_account_access_review').insert(row);
        report.push(row);
      }
    }

    return report;
  }

  /**
   * Fetches Rover data for fresh tables without inserting into main tables.
   * Used by the sync-fresh-data endpoint to avoid duplicate entries.
   * Handles both regular groups and service accounts.
   *
   * @param appname - Name of the application
   * @param frequency - Review frequency
   * @param period - Review period
   * @returns Promise resolving to array of fetched access records
   * @throws Error if no Rover data is found for the application
   */
  async fetchRoverDataForFresh(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]> {
    const report: any[] = [];

    const appEntries = await this.db('applications')
      .select(
        'type',
        'environment',
        'app_delegate',
        'account_name',
        'app_name',
        'app_owner',
      )
      .where({
        app_name: appname,
        source: 'rover',
      });

    if (!appEntries.length) {
      throw new Error(`No rover data found for appname: ${appname}`);
    }

    for (const app of appEntries) {
      const {
        type,
        environment,
        app_delegate,
        account_name,
        app_name,
        app_owner,
      } = app;

      const rover_group_name = account_name;

      if (type === 'rover-group-name') {
        const { memberUids, ownerUids } = await this.getGroupMembersAndOwners(
          rover_group_name,
        );

        const allUids = Array.from(new Set([...memberUids, ...ownerUids]));

        if (allUids.length === 0) {
          this.logger.warn(
            `No members or owners found for group: ${rover_group_name}`,
          );
          continue;
        }

        for (const uid of allUids) {
          const user = await this.getUserInfo(uid);
          if (!user) continue;

          let role = 'N/A';
          if (memberUids.includes(uid) && ownerUids.includes(uid))
            role = 'owner, member';
          else if (memberUids.includes(uid)) role = 'member';
          else if (ownerUids.includes(uid)) role = 'owner';

          const managerUid = extractUid(user.manager || '');
          const managerInfo = managerUid
            ? await this.getUserInfo(managerUid)
            : null;
          const managerName = managerInfo?.cn || managerUid || app_owner || '';

          const row = {
            environment,
            full_name: user.cn,
            user_id: user.uid,
            user_role: role,
            manager: managerName,
            manager_uid: managerUid || '',
            source: 'rover',
            account_name: rover_group_name,
            app_name,
            frequency,
            period,
            app_delegate,
          };

          report.push(row);
        }
      } else if (type === 'service-account') {
        // For service accounts, fetch the service account info from Rover to get manager UID
        const serviceAccountInfo = await this.getUserInfo(rover_group_name);
        let managerUid = '';
        let managerName = app_owner || '';

        if (serviceAccountInfo && serviceAccountInfo.manager) {
          managerUid = extractUid(serviceAccountInfo.manager) || '';
          if (managerUid) {
            const managerInfo = await this.getUserInfo(managerUid);
            managerName = managerInfo?.cn || managerUid || app_owner || '';
          }
        }

        // Fetch source from applications table
        const applicationData = await this.db('applications')
          .select('source')
          .where({
            account_name: rover_group_name,
            app_name: app_name,
          })
          .first();

        const source = applicationData?.source || 'rover'; // fallback to rover if not found

        const row = {
          app_name,
          environment,
          service_account: rover_group_name,
          user_role: 'service-account',
          manager: managerName,
          manager_uid: managerUid,
          source,
          account_name: rover_group_name,
          period,
          frequency,
          app_delegate,
        };
        report.push(row);
      }
    }

    return report;
  }
}
