import { LoggerService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { Config } from '@backstage/config';

/**
 * Delete operations for audit compliance database.
 * Contains all methods for deleting various types of data.
 */
export class DeleteOperations {
  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {}
  /**
   * Deletes all audit data for a specific app/frequency/period combination.
   * This includes both group access reports and service account access reviews.
   * Used during data refresh to ensure clean state before inserting new data.
   *
   * @param app_name - Name of the application
   * @param frequency - Review frequency (e.g., 'quarterly', 'annual')
   * @param period - Review period (e.g., '2024', 'Q1-2024')
   * @returns Promise resolving to deletion results
   */
  async deleteAuditData(
    app_name: string,
    frequency: string,
    period: string,
  ): Promise<{ groupAccessDeleted: number; serviceAccountsDeleted: number }> {
    try {
      // Delete group access reports
      const groupAccessDeleted = await this.db('group_access_reports')
        .where({ app_name, frequency, period })
        .delete();

      // Delete service account access reviews
      const serviceAccountsDeleted = await this.db(
        'service_account_access_review',
      )
        .where({ app_name, frequency, period })
        .delete();

      this.logger.info(
        `Deleted audit data for ${app_name}/${frequency}/${period}: ${groupAccessDeleted} group access records, ${serviceAccountsDeleted} service account records`,
      );

      return {
        groupAccessDeleted,
        serviceAccountsDeleted,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete audit data for ${app_name}/${frequency}/${period}`,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw new Error(
        `Failed to delete audit data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes a specific application by ID.
   *
   * @param id - Application ID to delete
   * @returns Promise resolving to number of deleted records
   */
  async deleteApplicationById(id: number): Promise<number> {
    try {
      const deletedCount = await this.db('applications').where({ id }).delete();

      this.logger.info(
        `Deleted application with ID ${id}: ${deletedCount} records`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete application with ID ${id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete application: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes all data for a specific application by name.
   * This includes applications, audits, access reviews, and related data.
   *
   * @param appName - Application name to delete
   * @returns Promise resolving to deletion summary
   */
  async deleteApplicationByName(appName: string): Promise<{
    applicationsDeleted: number;
    auditsDeleted: number;
    groupAccessDeleted: number;
    serviceAccountsDeleted: number;
    freshDataDeleted: number;
    activityEventsDeleted: number;
    metadataDeleted: number;
  }> {
    try {
      // Delete applications
      const applicationsDeleted = await this.db('applications')
        .where({ app_name: appName })
        .delete();

      // Delete application audits
      const auditsDeleted = await this.db('application_audits')
        .where({ app_name: appName })
        .delete();

      // Delete group access reports
      const groupAccessDeleted = await this.db('group_access_reports')
        .where({ app_name: appName })
        .delete();

      // Delete service account access reviews
      const serviceAccountsDeleted = await this.db(
        'service_account_access_review',
      )
        .where({ app_name: appName })
        .delete();

      // Delete fresh data
      const groupAccessFreshDeleted = await this.db(
        'group_access_reports_fresh',
      )
        .where({ app_name: appName })
        .delete();

      const serviceAccountsFreshDeleted = await this.db(
        'service_account_access_review_fresh',
      )
        .where({ app_name: appName })
        .delete();

      const freshDataDeleted =
        groupAccessFreshDeleted + serviceAccountsFreshDeleted;

      // Delete activity stream events
      const activityEventsDeleted = await this.db('activity_stream')
        .where({ app_name: appName })
        .delete();

      // Delete audit metadata (this will be handled by CASCADE due to foreign key)
      const metadataDeleted = 0; // CASCADE will handle this automatically

      this.logger.info(
        `Deleted all data for application ${appName}: ${applicationsDeleted} applications, ${auditsDeleted} audits, ${groupAccessDeleted} group access records, ${serviceAccountsDeleted} service account records, ${freshDataDeleted} fresh data records, ${activityEventsDeleted} activity events`,
      );

      return {
        applicationsDeleted,
        auditsDeleted,
        groupAccessDeleted,
        serviceAccountsDeleted,
        freshDataDeleted,
        activityEventsDeleted,
        metadataDeleted,
      };
    } catch (error) {
      this.logger.error(`Failed to delete application data for ${appName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete application data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes a specific audit record by ID.
   *
   * @param id - Audit ID to delete
   * @returns Promise resolving to number of deleted records
   */
  async deleteAuditById(id: number): Promise<number> {
    try {
      const deletedCount = await this.db('application_audits')
        .where({ id })
        .delete();

      this.logger.info(`Deleted audit with ID ${id}: ${deletedCount} records`);

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete audit with ID ${id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete audit: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes a specific service account access review by ID.
   *
   * @param id - Service account access review ID to delete
   * @returns Promise resolving to number of deleted records
   */
  async deleteServiceAccountAccessReviewById(id: number): Promise<number> {
    try {
      const deletedCount = await this.db('service_account_access_review')
        .where({ id })
        .delete();

      this.logger.info(
        `Deleted service account access review with ID ${id}: ${deletedCount} records`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete service account access review with ID ${id}`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw new Error(
        `Failed to delete service account access review: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes a specific group access report by ID.
   *
   * @param id - Group access report ID to delete
   * @returns Promise resolving to number of deleted records
   */
  async deleteGroupAccessReportById(id: number): Promise<number> {
    try {
      const deletedCount = await this.db('group_access_reports')
        .where({ id })
        .delete();

      this.logger.info(
        `Deleted group access report with ID ${id}: ${deletedCount} records`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete group access report with ID ${id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete group access report: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes fresh data for a specific app/frequency/period combination.
   *
   * @param app_name - Name of the application
   * @param frequency - Review frequency (e.g., 'quarterly', 'annual')
   * @param period - Review period (e.g., '2024', 'Q1-2024')
   * @returns Promise resolving to deletion results
   */
  async deleteFreshData(
    app_name: string,
    frequency: string,
    period: string,
  ): Promise<{
    groupAccessFreshDeleted: number;
    serviceAccountsFreshDeleted: number;
  }> {
    try {
      // Delete fresh group access reports
      const groupAccessFreshDeleted = await this.db(
        'group_access_reports_fresh',
      )
        .where({ app_name, frequency, period })
        .delete();

      // Delete fresh service account access reviews
      const serviceAccountsFreshDeleted = await this.db(
        'service_account_access_review_fresh',
      )
        .where({ app_name, frequency, period })
        .delete();

      this.logger.info(
        `Deleted fresh data for ${app_name}/${frequency}/${period}: ${groupAccessFreshDeleted} group access records, ${serviceAccountsFreshDeleted} service account records`,
      );

      return {
        groupAccessFreshDeleted,
        serviceAccountsFreshDeleted,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete fresh data for ${app_name}/${frequency}/${period}`,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw new Error(
        `Failed to delete fresh data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes a specific activity stream event by ID.
   *
   * @param id - Activity stream event ID to delete
   * @returns Promise resolving to number of deleted records
   */
  async deleteActivityStreamEventById(id: number): Promise<number> {
    try {
      const deletedCount = await this.db('activity_stream')
        .where({ id })
        .delete();

      this.logger.info(
        `Deleted activity stream event with ID ${id}: ${deletedCount} records`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete activity stream event with ID ${id}`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw new Error(
        `Failed to delete activity stream event: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes audit metadata by ID.
   *
   * @param id - Audit metadata ID to delete
   * @returns Promise resolving to number of deleted records
   */
  async deleteAuditMetadataById(id: number): Promise<number> {
    try {
      const deletedCount = await this.db('audit_metadata')
        .where({ id })
        .delete();

      this.logger.info(
        `Deleted audit metadata with ID ${id}: ${deletedCount} records`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete audit metadata with ID ${id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete audit metadata: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Deletes all data from all tables (DANGEROUS - use with caution).
   * This method should only be used in development or testing environments.
   *
   * @returns Promise resolving to deletion summary
   */
  async deleteAllData(): Promise<{
    applicationsDeleted: number;
    auditsDeleted: number;
    groupAccessDeleted: number;
    serviceAccountsDeleted: number;
    groupAccessFreshDeleted: number;
    serviceAccountsFreshDeleted: number;
    activityEventsDeleted: number;
    metadataDeleted: number;
  }> {
    try {
      // Delete all data from all tables
      const applicationsDeleted = await this.db('applications').delete();
      const auditsDeleted = await this.db('application_audits').delete();
      const groupAccessDeleted = await this.db('group_access_reports').delete();
      const serviceAccountsDeleted = await this.db(
        'service_account_access_review',
      ).delete();
      const groupAccessFreshDeleted = await this.db(
        'group_access_reports_fresh',
      ).delete();
      const serviceAccountsFreshDeleted = await this.db(
        'service_account_access_review_fresh',
      ).delete();
      const activityEventsDeleted = await this.db('activity_stream').delete();
      const metadataDeleted = await this.db('audit_metadata').delete();

      this.logger.warn(
        `DELETED ALL DATA: ${applicationsDeleted} applications, ${auditsDeleted} audits, ${groupAccessDeleted} group access records, ${serviceAccountsDeleted} service account records, ${groupAccessFreshDeleted} fresh group access records, ${serviceAccountsFreshDeleted} fresh service account records, ${activityEventsDeleted} activity events, ${metadataDeleted} metadata records`,
      );

      return {
        applicationsDeleted,
        auditsDeleted,
        groupAccessDeleted,
        serviceAccountsDeleted,
        groupAccessFreshDeleted,
        serviceAccountsFreshDeleted,
        activityEventsDeleted,
        metadataDeleted,
      };
    } catch (error) {
      this.logger.error('Failed to delete all data', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete all data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
