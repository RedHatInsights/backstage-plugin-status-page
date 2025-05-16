import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-audit-compliance-backend',
  'migrations',
);

// Interface for AuditComplianceStore with required method signatures
export interface AuditComplianceStore {
  // Method removed from implementation - update interface accordingly
  // getAccessReviewData(appId: string, frequency: string, period: string): Promise<any[]>;
}

export class AuditComplianceDatabase implements AuditComplianceStore {
  private readonly db: Knex;

  private constructor(knex: Knex) {
    this.db = knex;
  }

  /**
   * Initializes the AuditComplianceDatabase, runs migrations if needed.
   * @param options - knex client and migration flag
   */
  static async create(options: {
    knex: Knex;
    skipMigrations: boolean;
  }): Promise<AuditComplianceDatabase> {
    const database = options.knex;

    if (!options.skipMigrations) {
      await database.migrate.latest({ directory: migrationsDir });
    }

    return new AuditComplianceDatabase(database);
  }

  /**
   * Returns distinct application entries by app_name,
   * including app_owner, app_delegate, and cmdb_id.
   * Ensures one representative row per app_name.
   */
  async getAllApplications() {
    return this.db
      .select('app_name', 'app_owner', 'app_delegate', 'cmdb_id')
      .from(
        this.db('applications')
          .distinctOn('app_name')
          .orderBy(['app_name', 'created_at'])
          .as('distinct_apps'),
      );
  }

  /**
   * Inserts a new application.
   * @param appData - data of the new application
   * Used in: POST /applications
   */
  async insertApplication(appData: any) {
    const [id] = await this.db('applications').insert(appData).returning('id');
    return id;
  }

  /**
   * Updates application details.
   * @param id - application ID
   * @param updateData - fields to update
   * Used in: PUT /applications/:id
   */
  async updateApplication(id: number, updateData: any) {
    return this.db('applications').where({ id }).update(updateData);
  }

  /**
   * Retrieves access review data filtered by application name, frequency, and period.
   * @param params - includes app_name, frequency, period
   * Used in: GET /access-reviews
   */
  async getAccessReviews(params: {
    app_name: string;
    frequency: string;
    period: string;
  }) {
    const { app_name, frequency, period } = params;
    return await this.db('group_access_reports')
      .where({ app_name, frequency, period })
      .select();
  }

  /**
   * Inserts or updates access review records in batch.
   * @param data - array of access review data
   * Used in: POST /access-reviews
   */
  async updateAccessReview(data: any[]): Promise<any[]> {
    const results = [];

    for (const item of data) {
      const { full_name, app_name, frequency, period } = item;

      if (!full_name || !app_name || !frequency || !period) {
        results.push({
          error: 'full_name, app_name, frequency, and period are required',
          data: item,
        });
        continue;
      }

      const matchConditions = { full_name, app_name, frequency, period };
      const existing = await this.db('group_access_reports')
        .where(matchConditions)
        .first();

      // Create a copy of item and exclude 'id'
      const { id, ...rest } = item;
      const recordData = {
        ...rest,
        sign_off_date: item.sign_off_date || null,
        access_change_date: item.access_change_date || null,
      };

      if (existing) {
        await this.db('group_access_reports')
          .where(matchConditions)
          .update(recordData);
        results.push({
          type: 'update',
          full_name,
          app_name,
          period,
          frequency,
        });
      } else {
        await this.db('group_access_reports').insert(recordData);
        results.push({
          type: 'insert',
          full_name,
          app_name,
          period,
          frequency,
        });
      }
    }

    return results;
  }

  /**
   * Retrieves all audit records.
   * Used in: GET /audits
   */
  async getAllAudits() {
    return this.db('application_audits').select();
  }

  /**
   * Inserts a new audit record.
   * @param auditData - audit data to insert
   * Used in: POST /audits
   */
  async insertAudit(auditData: any) {
    const [id] = await this.db('application_audits')
      .insert(auditData)
      .returning('id');
    return id;
  }

  /**
   * Updates an existing audit record.
   * @param id - audit ID
   * @param updateData - audit fields to update
   * Used in: PUT /audits/:id
   */
  async updateAudit(id: number, updateData: any) {
    return this.db('application_audits').where({ id }).update(updateData);
  }

  /**
   * Finds an audit by application name, frequency, and period.
   * @param appName - name of application
   * @param frequency - audit frequency
   * @param period - audit period
   * Used in: POST /audits/check-duplicate
   */
  async findAuditByAppNamePeriod(
    appName: string,
    frequency: string,
    period: string,
  ) {
    return await this.db('application_audits')
      .where({ app_name: appName, frequency, period })
      .first();
  }

  /**
   * Retrieves service account access reviews filtered by parameters.
   * @param queryParams - app_name, frequency, period
   * Used in: GET /service_account_access_review
   */
  async getServiceAccountAccessReviews(queryParams: {
    app_name: string;
    frequency: string;
    period: string;
  }) {
    const { app_name, frequency, period } = queryParams;

    if (!app_name || !frequency || !period) {
      throw new Error('app_name, frequency, and period are required');
    }

    return await this.db('service_account_access_review')
      .where('app_name', 'ilike', app_name)
      .andWhere('frequency', frequency)
      .andWhere('period', period)
      .select();
  }

  /**
   * Updates service account access review entries.
   * @param inputData - single or array of update objects
   * Used in: POST /service_account_access_review
   */
  async updateServiceAccountAccessReviewData(
    inputData: any | any[],
  ): Promise<any[]> {
    const dataItems = Array.isArray(inputData) ? inputData : [inputData];
    const results: any[] = [];

    const trx = await this.db.transaction();

    try {
      for (const item of dataItems) {
        const { service_account } = item;

        if (!service_account) {
          results.push({
            status: 'error',
            message: 'service_account is required',
            data: item,
          });
          continue;
        }

        const existing = await trx('service_account_access_review')
          .where({ service_account })
          .first();

        if (!existing) {
          results.push({
            status: 'error',
            message: `No matching record for service_account: ${service_account}`,
            data: item,
          });
          continue;
        }

        const updatePayload = {
          signed_off: item.signed_off ?? existing.signed_off,
          signed_off_by: item.signed_off_by ?? existing.signed_off_by,
          sign_off_date: item.sign_off_date ?? existing.sign_off_date,
          comments: item.comments ?? existing.comments,
          ticket_reference: item.ticket_reference ?? existing.ticket_reference,
          date_of_access_revoked:
            item.date_of_access_revoked ?? existing.date_of_access_revoked,
          ticket_status: item.ticket_status ?? existing.ticket_status,
          updated_at: this.db.fn.now(),
        };

        await trx('service_account_access_review')
          .where({ service_account })
          .update(updatePayload);

        results.push({
          status: 'updated',
          service_account,
        });
      }

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    return results;
  }
}
