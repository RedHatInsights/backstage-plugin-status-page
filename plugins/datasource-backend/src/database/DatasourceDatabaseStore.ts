import { Knex } from 'knex';
import { Datasource } from '../schema/openapi/generated/models';
import { DbDatasourceRow } from './tables';

export class DatasourceDatabaseStore {
  TABLE_NAME = 'datasource';

  constructor(private database: Knex) {}

  async getAllDatasources() {
    const result = await this.database
      .table<DbDatasourceRow>(this.TABLE_NAME)
      .select('*');
    return result.map(this.mapDbModelToDatasource);
  }
  async getDatasourceById(id: string, namespace: string) {
    const result = await this.database
      .table<DbDatasourceRow>(this.TABLE_NAME)
      .select('*')
      .where('name', id)
      .andWhere('namespace', namespace)
      .orWhere('id', id)
      .first();
    if (!result) return undefined;
    return this.mapDbModelToDatasource(result);
  }

  async createDatasource(data: Datasource) {
    const [result] = await this.database
      .table<DbDatasourceRow>(this.TABLE_NAME)
      .insert(this.mapDatasourceToDbModel(data), '*');

    return this.mapDbModelToDatasource(result);
  }

  // TODO: implement method to update datasource.
  async updateDatasource() {}

  async deleteDatasource(id: string, namespace: string) {
    const result = await this.database
      .table<DbDatasourceRow>(this.TABLE_NAME)
      .select('*')
      .where('name', id)
      .andWhere('namespace', namespace)
      .orWhere('id', id)
      .del();
    return result === 1;
  }

  private mapDbModelToDatasource(data: DbDatasourceRow): Datasource {
    return {
      ...data,
      dependencyOf: JSON.parse(data.dependencyOf) as string[],
      dependsOn: JSON.parse(data.dependsOn) as string[],
      existsIn: JSON.parse(data.existsIn),
    };
  }
  private mapDatasourceToDbModel(data: Datasource): DbDatasourceRow {
    return {
      ...data,
      dependencyOf: JSON.stringify(data.dependencyOf),
      dependsOn: JSON.stringify(data.dependsOn),
      existsIn: JSON.stringify(data.existsIn),
    };
  }
}
