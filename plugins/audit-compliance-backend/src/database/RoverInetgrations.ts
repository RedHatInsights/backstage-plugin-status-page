import {
  RootConfigService,
  resolvePackagePath,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { fetch } from 'undici';

interface UserInfoResponse {
  result?: any;
}

interface GroupInfo {
  memberUids?: string[];
  ownerUids?: string[];
}

interface GroupApiResponse {
  result?: {
    result?: GroupInfo[];
  };
}

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-audit-compliance-backend',
  'migrations',
);

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Backstage-Plugin',
};

const extractUid = (dn: string): string | null =>
  dn?.startsWith('uid=') ? dn.split(',')[0].split('=')[1] : null;

export interface RoverStore {
  getGroupAccessReport(groupCn: string): Promise<any[]>;
}

export class RoverDatabase implements RoverStore {
  private readonly db: Knex;
  private readonly roverUsername: string;
  private readonly roverPassword: string;
  private readonly roverBaseUrl: string;
  private readonly logger: LoggerService;

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

  private getAuthHeader(): { Authorization: string } {
    return {
      Authorization: `Basic ${Buffer.from(
        `${this.roverUsername}:${this.roverPassword}`,
      ).toString('base64')}`,
    };
  }

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
            sign_off_status: 'pending',
            sign_off_by: 'N/A',
            sign_off_date: null,
            source: 'rover',
            comments: '',
            ticket_reference: '',
            access_change_date: null,
            created_at: new Date(),
            rover_group_name,
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
        const row = {
          app_name,
          environment,
          service_account: rover_group_name,
          user_role: 'service-account',
          manager: app_owner,
          signed_off: 'Pending',
          signed_off_by: 'N/A',
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
        };

        await this.db('service_account_access_review').insert(row);
        report.push(row);
      }
    }

    return report;
  }
}
