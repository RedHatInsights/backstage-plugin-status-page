import { Knex } from 'knex';
import { ART } from '../types';
import { knexNow } from '../utils/knexNow';
import { normalizeEmail } from '../utils/normalizeEmail';
import { ArtDatabaseModel } from './types';

export interface ArtDatabaseStore {
  insertArt(data: ART): Promise<ART>;
  getArtById(id: string): Promise<ART | null>;
  listArts(): Promise<ART[]>;
  updateArt(id: string, data: ART): Promise<ART | null>;
  deleteArt(id: string): Promise<any>;
}

export class ArtBackendDatabase implements ArtDatabaseStore {
  private readonly ART_TABLE = 'arts';

  constructor(private readonly db: Knex) {}

  async insertArt(data: ART): Promise<ART> {
    const transformedData = this.mapArtToArtModel(data);
    const [dbResult] = await this.db<ArtDatabaseModel>(this.ART_TABLE).insert(
      transformedData,
      '*',
    );
    return this.mapArtModelToArt(dbResult);
  }
  async getArtById(id: string): Promise<ART | null> {
    const dbResult = await this.db<ArtDatabaseModel>(this.ART_TABLE)
      .where('name', id)
      .first();

    if (!dbResult) {
      return null;
    }

    return this.mapArtModelToArt(dbResult);
  }
  async listArts(): Promise<ART[]> {
    const dbResult = await this.db<ArtDatabaseModel>(this.ART_TABLE).select();
    return dbResult.map(data => this.mapArtModelToArt(data));
  }
  async updateArt(id: string, data: ART): Promise<ART | null> {
    const updatedData = this.mapArtToArtModel(data);
    const dbResult = await this.db<ArtDatabaseModel>(this.ART_TABLE)
      .select('*')
      .where('name', id)
      .first()
      .update({ ...updatedData, updated_at: knexNow() }, '*');
    if (dbResult.length < 1) {
      return null;
    }
    return this.mapArtModelToArt(dbResult[0]);
  }
  async deleteArt(id: string): Promise<any> {
    const result = await this.db<ArtDatabaseModel>(this.ART_TABLE)
      .select('*')
      .where('name', id)
      .del();
    if (result === 1) {
      return result;
    }
    return null;
  }

  private mapArtToArtModel(art: ART): ArtDatabaseModel {
    return {
      workstreams: JSON.stringify(art.workstreams) || art.workstreams.join(','),
      title: art.title,
      rte: art.rte,
      pillar: art.pillar,
      name: art.name,
      members: JSON.stringify(art.members),
      id: art.artId,
      description: art.description,
      jira_project: art.jiraProject,
      created_by: art.createdBy,
      updated_by: art.updatedBy,
      links: JSON.stringify(
        art.links.map(link => ({
          ...link,
          ...(link.type?.toLowerCase() === 'email' && {
            url: normalizeEmail(link.url),
          }),
        })),
      ),
    };
  }

  private mapArtModelToArt(dbModel: ArtDatabaseModel): ART {
    return {
      artId: dbModel.id,
      name: dbModel.name,
      title: dbModel.title,
      description: dbModel.description,
      pillar: dbModel.pillar,
      workstreams: JSON.parse(dbModel.workstreams),
      rte: dbModel.rte,
      members: JSON.parse(dbModel.members),
      jiraProject: dbModel.jira_project,
      createdAt: dbModel.created_at,
      updatedAt: dbModel.updated_at,
      createdBy: dbModel.created_by,
      updatedBy: dbModel.updated_by,
      links: JSON.parse(dbModel.links),
    };
  }
}
