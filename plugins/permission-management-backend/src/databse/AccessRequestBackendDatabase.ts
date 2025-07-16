import { Knex } from 'knex';
import { AccessRequestDatabaseModel } from './types';
import { AccessRequest } from '../types';

export interface AccessRequestBackendStore {
  insertAccessRequest(data: AccessRequest): Promise<AccessRequest>;
  getAccessRequestById(id: string): Promise<AccessRequest | null>;
  listAccessRequests(): Promise<AccessRequest[]>;
  updateAccessRequest(id: string, data: AccessRequest): Promise<AccessRequest | null>;
  deleteAccessRequest(id: string): Promise<any>;
}

export class AccessRequestBackendDatabase implements AccessRequestBackendStore {
  private readonly ACCESS_REQUEST_TABLE = 'access_requests';

  constructor(private readonly db: Knex) { }

  async insertAccessRequest(data: AccessRequest): Promise<AccessRequest> {
    const transformed = this.mapAccessRequestToDatabaseModel(data);
    const [dbResult] = await this.db<AccessRequestDatabaseModel>(
      this.ACCESS_REQUEST_TABLE,
    ).insert(transformed, '*');
    return this.mapDatabaseModelToAccessRequest(dbResult);
  }

  async insertAccessRequests(data: AccessRequest | AccessRequest[]): Promise<AccessRequest[]> {
    const requests = Array.isArray(data) ? data : [data];
    const transformed = requests.map(this.mapAccessRequestToDatabaseModel);

    const dbResults = await this.db<AccessRequestDatabaseModel>(
      this.ACCESS_REQUEST_TABLE,
    ).insert(transformed, '*');

    return dbResults.map(this.mapDatabaseModelToAccessRequest);
  }


  async getAccessRequestById(id: string): Promise<AccessRequest | null> {
    const dbResult = await this.db<AccessRequestDatabaseModel>(
      this.ACCESS_REQUEST_TABLE,
    )
      .where('userId', id)
      .first();

    if (!dbResult) {
      return null;
    }

    return this.mapDatabaseModelToAccessRequest(dbResult);
  }

  async getAccessRequests(filters: Partial<AccessRequest>): Promise<AccessRequest[]> {
    const query = this.db<AccessRequestDatabaseModel>(this.ACCESS_REQUEST_TABLE);

    const allowedFilters: (keyof AccessRequestDatabaseModel)[] = [
      'userId',
      'group',
      'status',
      'role',
      'reviewer',
      'createdBy',
      'updatedBy',
    ];

    for (const key of allowedFilters) {
      const value = filters[key];
      if (value !== undefined) {
        query.where(key, value);
      }
    }

    const dbResults = await query;

    return dbResults.map(this.mapDatabaseModelToAccessRequest);
  }


  async listAccessRequests(): Promise<AccessRequest[]> {
    const dbResult = await this.db<AccessRequestDatabaseModel>(
      this.ACCESS_REQUEST_TABLE,
    ).select();
    return dbResult.map((row: AccessRequestDatabaseModel) => this.mapDatabaseModelToAccessRequest(row));
  }

  async updateAccessRequest(
    id: string,
    data: AccessRequest,
  ): Promise<AccessRequest | null> {
    const updatedData = this.mapAccessRequestToDatabaseModel(data);
    const dbResult = await this.db<AccessRequestDatabaseModel>(
      this.ACCESS_REQUEST_TABLE,
    )
      .where('id', id)
      .update({ ...updatedData, updatedAt: this.db.fn.now() }, '*');

    if (dbResult.length < 1) {
      return null;
    }

    return this.mapDatabaseModelToAccessRequest(dbResult[0]);
  }

  async deleteAccessRequest(id: string): Promise<any> {
    const result = await this.db<AccessRequestDatabaseModel>(
      this.ACCESS_REQUEST_TABLE,
    )
      .where('userId', id)
      .del();
    return result === 1 ? result : null;
  }

  private mapAccessRequestToDatabaseModel(
    request: AccessRequest,
  ): AccessRequestDatabaseModel {
    return {
      id: request.id,
      userName: request.userName,
      userEmail: request.userEmail,
      userId: request.userId,
      timestamp: request.timestamp,
      status: request.status,
      group: request.group,
      role: request.role,
      reason: request.reason,
      reviewer: request.reviewer,
      rejectionReason: request.rejectionReason,
      createdBy: request.createdBy,
      updatedBy: request.updatedBy,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  private mapDatabaseModelToAccessRequest(
    dbModel: AccessRequestDatabaseModel,
  ): AccessRequest {
    return {
      id: dbModel.id,
      userName: dbModel.userName,
      userEmail: dbModel.userEmail,
      userId: dbModel.userId,
      timestamp: dbModel.timestamp,
      status: dbModel.status,
      group: dbModel.group,
      role: dbModel.role,
      reason: dbModel.reason,
      reviewer: dbModel.reviewer,
      rejectionReason: dbModel.rejectionReason,
      createdBy: dbModel.createdBy,
      updatedBy: dbModel.updatedBy,
      createdAt: dbModel.createdAt,
      updatedAt: dbModel.updatedAt,
    };
  }
}
