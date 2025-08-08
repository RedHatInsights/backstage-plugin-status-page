import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { v4 as uuidv4 } from 'uuid';

const migrationsDir = resolvePackagePath(
  '@appdev/backstage-plugin-outage-template-backend',
  'migrations',
);

export interface IncidentsStore {
  insertTemplate(data: any): Promise<any>;
  getTemplates(): Promise<any>;
  updateTemplate(data: TemplateBody): Promise<any>;
  deleteTemplate(templateId: string): Promise<any>;
}

export class IncidentsDatabase implements IncidentsStore {
  private readonly TEMPLATES_TABLE = 'templates';

  static async create(options: {
    knex: Knex;
    skipMigrations: boolean;
  }): Promise<IncidentsStore> {
    const database = options.knex;

    if (!options.skipMigrations)
      await database.migrate.latest({
        directory: migrationsDir,
      });

    return new IncidentsDatabase(database);
  }

  constructor(private readonly db: Knex) {}

  async insertTemplate(data: any): Promise<any> {
    const [dbResult] = await this.db<any>(this.TEMPLATES_TABLE).insert(
      {
        ...data,
        id: uuidv4(),
        created_on: this.db.fn.now(),
        last_updated_on: this.db.fn.now(),
      },
      '*',
    );
    return dbResult;
  }

  async getTemplates(): Promise<any> {
    return await this.db<any>(this.TEMPLATES_TABLE).select('*');
  }

  async updateTemplate(data: any): Promise<any> {
    return await this.db<any>(this.TEMPLATES_TABLE)
      .where('id', data.id)
      .update({
        ...data,
        last_updated_on: this.db.fn.now(),
      });
  }

  async deleteTemplate(templateId: string): Promise<any> {
    return await this.db<any>(this.TEMPLATES_TABLE)
      .where('id', templateId)
      .delete();
  }
}
