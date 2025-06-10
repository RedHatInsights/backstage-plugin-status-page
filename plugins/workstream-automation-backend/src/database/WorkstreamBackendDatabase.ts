import { Knex } from 'knex';
import { Member, Workstream } from '../types';
import { WorkstreamDatabaseModel } from './types';
import { EntityLink } from '@backstage/catalog-model';

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
      .update({ ...updatedData, updated_at: this.db.fn.now() }, '*');

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
      art: workstream.art,
      updated_by: workstream.updatedBy,
      created_by: workstream.createdBy,
      links: JSON.stringify(
        workstream.links.map(link => ({
          ...link,
          ...(link.type?.toLowerCase() === 'email' && {
            url: `mailto://${link.url}`,
          }),
        })),
      ),
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
      links: JSON.parse(dbModel.links) as EntityLink[],
      updatedBy: dbModel.updated_by ?? dbModel.created_by,
      art: dbModel.art,
    };
  }
}
