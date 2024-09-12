import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { Member, Workstream } from '../types';
import { WorkstreamDatabaseModel } from './types';

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-workstream-automation-backend',
  'migrations',
);

export interface WorkstreamBackendStore {
  insertWorkstream(data: Workstream): Promise<Workstream>;
  getWorkstreamById(id: string): Promise<Workstream | null>;
  listWorkstreams(): Promise<Workstream[]>;
  getWorkstreamForMember(userRef: string): Promise<Workstream[]>;
  updateWorkstream(id: string, data: Workstream): Promise<Workstream | null>;
  deleteWorkstream(id: string): Promise<any>;
}

export class WorkstreamBackendDatabase implements WorkstreamBackendStore {
  private readonly WORKSTREAM_TABLE = 'workstreams';
  static async create(options: {
    knex: Knex;
    skipMigrations: boolean;
  }): Promise<WorkstreamBackendStore> {
    const database = options.knex;

    if (!options.skipMigrations)
      await database.migrate.latest({
        directory: migrationsDir,
      });

    return new WorkstreamBackendDatabase(database);
  }
  constructor(private readonly db: Knex) {}

  async deleteWorkstream(id: string): Promise<any> {
    const result = await this.db<WorkstreamDatabaseModel>(this.WORKSTREAM_TABLE)
      .select('*')
      .where('name', id)
      .del();
    if (result === 1) {
      return result;
    }
    return null;
  }

  async updateWorkstream(
    id: string,
    data: Workstream,
  ): Promise<Workstream | null> {
    const updatedData = this.mapWorkstreamToDatabaseModel(data);
    const dbResult = await this.db<WorkstreamDatabaseModel>(
      this.WORKSTREAM_TABLE,
    )
      .select('*')
      .where('name', id)
      .first()
      .update(updatedData, '*');

    if (dbResult.length < 1) {
      return null;
    }
    return this.mapDatabaseModelToWorkstream(dbResult[0]);
  }

  async listWorkstreams(): Promise<Workstream[]> {
    const dbResult = await this.db<WorkstreamDatabaseModel>(
      this.WORKSTREAM_TABLE,
    ).select();
    return dbResult.map(data => this.mapDatabaseModelToWorkstream(data));
  }
  async insertWorkstream(data: Workstream) {
    const transformedData = this.mapWorkstreamToDatabaseModel(data);
    const [dbResult] = await this.db<WorkstreamDatabaseModel>(
      this.WORKSTREAM_TABLE,
    ).insert(transformedData, '*');
    return this.mapDatabaseModelToWorkstream(dbResult);
  }

  async getWorkstreamById(id: string): Promise<Workstream | null> {
    const dbResult = await this.db<WorkstreamDatabaseModel>(
      this.WORKSTREAM_TABLE,
    )
      .where('name', id)
      .first();

    if (!dbResult) {
      return null;
    }

    return this.mapDatabaseModelToWorkstream(dbResult);
  }

  async getWorkstreamForMember(userRef: string): Promise<Workstream[]> {
    const dbResult = await this.db<WorkstreamDatabaseModel>(
      this.WORKSTREAM_TABLE,
    )
      .select('*')
      .whereRaw('members::jsonb @> ?', JSON.stringify([{ userRef }]));
    return dbResult.map(data => this.mapDatabaseModelToWorkstream(data));
  }

  private mapWorkstreamToDatabaseModel(
    workstream: Workstream,
  ): WorkstreamDatabaseModel {
    return {
      id: workstream.workstreamId,
      name: workstream.name,
      title: workstream.title,
      portfolio: workstream.portfolio.join(','),
      members: JSON.stringify(workstream.members),
      description: workstream.description,
      pillar: workstream.pillar,
      lead: workstream.lead,
      jira_project: workstream.jiraProject,
      created_by: workstream.createdBy,
      slack_channel_url: workstream.slackChannelUrl,
      email: workstream.email,
    };
  }

  private mapDatabaseModelToWorkstream(
    dbModel: WorkstreamDatabaseModel,
  ): Workstream {
    return {
      workstreamId: dbModel.id,
      name: dbModel.name,
      title: dbModel.title,
      description: dbModel.description,
      pillar: dbModel.pillar,
      portfolio: dbModel.portfolio ? dbModel.portfolio.split(',') : [],
      lead: dbModel.lead,
      members: JSON.parse(dbModel.members) as Member[],
      jiraProject: dbModel.jira_project,
      createdAt: dbModel.created_at,
      updatedAt: dbModel.updated_at,
      createdBy: dbModel.created_by,
      slackChannelUrl: dbModel.slack_channel_url,
      email: dbModel.email,
    };
  }
}
