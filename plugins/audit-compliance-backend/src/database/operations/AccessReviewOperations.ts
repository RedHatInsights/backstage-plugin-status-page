import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { Knex } from 'knex';
import { ReviewData } from '../AuditComplianceDatabase.types';
import { checkAndUpdateJiraStatuses } from '../integrations/JiraIntegration';
import { ActivityStreamOperations } from './ActivityStreamOperations';
import { JiraOperations } from './JiraOperations';

export class AccessReviewOperations {
  private readonly activityStreamOps: ActivityStreamOperations;
  private readonly jiraOps: JiraOperations;

  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {
    this.activityStreamOps = new ActivityStreamOperations(db, logger);
    this.jiraOps = new JiraOperations(db, logger, config);
  }
  /**
   * Retrieves access review records filtered by application name, frequency, and period.
   *
   * @param params - Query parameters
   * @param params.app_name - Name of the application
   * @param params.frequency - Review frequency (e.g., 'quarterly', 'annual')
   * @param params.period - Review period (e.g., 'Q1-2024')
   * @returns Promise resolving to array of access review records
   */
  async getAccessReviews(params: {
    app_name: string;
    frequency: string;
    period: string;
  }) {
    const { app_name, frequency, period } = params;
    this.logger.debug('Fetching access reviews', {
      app_name,
      frequency,
      period,
    });
    return await this.db('group_access_reports')
      .where({ app_name, frequency, period })
      .select();
  }

  /**
   * Updates or inserts access review records in batch.
   * Creates activity stream events for status changes and updates Jira tickets.
   *
   * @param data - Array of access review records to update/insert
   * @returns Promise resolving to array of operation results containing:
   *          - type: 'update' or 'insert'
   *          - full_name: Name of the user
   *          - app_name: Application name
   *          - period: Review period
   *          - frequency: Review frequency
   */
  async updateAccessReview(data: any[]): Promise<any[]> {
    const results = [];

    for (const item of data) {
      const {
        full_name,
        user_id,
        app_name,
        frequency,
        period,
        sign_off_status,
        sign_off_by,
        source,
      } = item;

      if (
        !full_name ||
        !user_id ||
        !app_name ||
        !frequency ||
        !period ||
        !source
      ) {
        results.push({
          error:
            'full_name, user_id, app_name, frequency, period, and source are required',
          data: item,
        });
        continue;
      }

      // Match must include user_id and source
      const matchConditions = {
        full_name,
        user_id,
        app_name,
        frequency,
        period,
        source,
      };
      const existing = await this.db('group_access_reports')
        .where(matchConditions)
        .first();

      const { id, ...rest } = item;
      const recordData = {
        ...rest,
        sign_off_date: item.sign_off_date || null,
        access_change_date: this.db.fn.now(),
        // Always clear ticket fields and comments on approval
        ticket_reference:
          sign_off_status === 'approved' ? null : item.ticket_reference || null,
        ticket_status:
          sign_off_status === 'approved' ? null : item.ticket_status || null,
        comments: sign_off_status === 'approved' ? null : item.comments || null,
      };

      this.logger.debug('Updating Access Review', { recordData });

      if (existing) {
        // Check if sign_off_status has changed
        if (sign_off_status && sign_off_status !== existing.sign_off_status) {
          // Create activity stream event for status change
          await this.activityStreamOps.createActivityEvent({
            event_type:
              sign_off_status === 'approved'
                ? 'ACCESS_APPROVED'
                : 'ACCESS_REVOKED',
            app_name,
            frequency,
            period,
            user_id: full_name,
            performed_by: sign_off_by || 'system',
            metadata: {
              previous_status: existing.sign_off_status,
              new_status: sign_off_status,
              reason: item.comments || '',
            },
          });
        }

        await this.db('group_access_reports')
          .where(matchConditions)
          .update(recordData);
        results.push({
          type: 'update',
          full_name,
          user_id,
          app_name,
          period,
          frequency,
          source,
        });
      } else {
        await this.db('group_access_reports').insert(recordData);
        results.push({
          type: 'insert',
          full_name,
          user_id,
          app_name,
          period,
          frequency,
          source,
        });
      }
    }

    this.logger.debug('Access Review Update Results', { results });

    // After updating access reviews, check and update Jira statuses
    await checkAndUpdateJiraStatuses(this.db, this.logger, this.config);

    return results;
  }

  /**
   * Retrieves group access review data for approved and rejected access.
   *
   * @param appname - Name of the application
   * @param frequency - Review frequency
   * @param period - Review period
   * @returns Promise resolving to ReviewData containing approved and rejected items
   */
  async getGroupAccessReviewData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<ReviewData> {
    const approved = await this.db('group_access_reports')
      .select(
        'user_id',
        'full_name',
        'environment',
        'user_role',
        'manager_name',
        'updated_at',
        'source',
      )
      .where({
        app_name: appname,
        frequency,
        period,
        sign_off_status: 'approved',
      });

    const rejected = await this.db('group_access_reports')
      .select(
        'user_id',
        'full_name',
        'environment',
        'user_role',
        'manager_name',
        'updated_at',
        'source',
      )
      .where({
        app_name: appname,
        frequency,
        period,
        sign_off_status: 'rejected',
      });

    return {
      approved,
      rejected,
    };
  }

  /**
   * Retrieves service account access reviews filtered by application, frequency, and period.
   *
   * @param queryParams - Query parameters
   * @param queryParams.app_name - Name of the application
   * @param queryParams.frequency - Review frequency
   * @param queryParams.period - Review period
   * @returns Promise resolving to array of service account access review records
   * @throws Error if required parameters are missing
   */
  async getServiceAccountAccessReviews(queryParams: {
    app_name: string;
    frequency: string;
    period: string;
  }) {
    const { app_name, frequency, period } = queryParams;

    if (!app_name || !frequency || !period) {
      this.logger.error('Missing required parameters', {
        app_name,
        frequency,
        period,
      });
      throw new Error('app_name, frequency, and period are required');
    }

    this.logger.debug('Fetching service account access reviews', {
      app_name,
      frequency,
      period,
    });

    return await this.db('service_account_access_review')
      .where('app_name', 'ilike', app_name)
      .andWhere('frequency', frequency)
      .andWhere('period', period)
      .select();
  }

  /**
   * Updates service account access review records in batch.
   * Creates activity events for status changes and Jira tickets for new reviews.
   *
   * @param inputData - Single record or array of records to update
   * @returns Promise resolving to array of operation results
   */
  async updateServiceAccountAccessReviewData(
    inputData: any | any[],
  ): Promise<any[]> {
    const dataItems = Array.isArray(inputData) ? inputData : [inputData];
    const results: any[] = [];

    const trx = await this.db.transaction();

    try {
      for (const item of dataItems) {
        const {
          service_account,
          app_name,
          frequency,
          period,
          comments,
          description,
          sign_off_status,
          sign_off_by,
          source,
        } = item;

        if (!service_account) {
          results.push({
            status: 'error',
            message: 'service_account is required',
            data: item,
          });
          continue;
        }

        const existing = await trx('service_account_access_review')
          .where({
            service_account,
            app_name,
            frequency,
            period,
          })
          .first();

        if (!existing) {
          results.push({
            status: 'error',
            message: `No matching record for service_account: ${service_account}`,
            data: item,
          });
          continue;
        }

        // Check if sign_off_status has changed
        if (
          sign_off_status &&
          sign_off_status.toLowerCase() !==
            existing.sign_off_status?.toLowerCase()
        ) {
          // Create activity stream event for status change
          await this.activityStreamOps.createActivityEvent({
            event_type:
              sign_off_status.toLowerCase() === 'approved'
                ? 'ACCESS_APPROVED'
                : 'ACCESS_REVOKED',
            app_name: app_name || existing.app_name,
            frequency: frequency || existing.frequency,
            period: period || existing.period,
            user_id: service_account,
            performed_by: sign_off_by || 'system',
            metadata: {
              previous_status: existing.sign_off_status,
              new_status: sign_off_status,
              reason: comments || '',
            },
          });
        }

        // If this is a new review (no ticket_reference) and status is 'rejected', create a Jira ticket
        if (
          sign_off_status &&
          sign_off_status.toLowerCase() === 'rejected' &&
          !existing.ticket_reference
        ) {
          try {
            const jiraTicket =
              await this.jiraOps.createServiceAccountJiraTicket({
                service_account,
                appName: app_name || existing.app_name,
                frequency: frequency || existing.frequency,
                period: period || existing.period,
                title:
                  item.title ||
                  `Service account access review for ${service_account}`,
                description:
                  description ||
                  `Service account access review for ${service_account}`,
                comments: comments || '',
                manager_uid: item.manager_uid,
                current_user_uid: item.current_user_uid,
                manager_name: item.manager_name,
              });

            results.push({
              status: 'created_ticket',
              service_account,
              jira_ticket: jiraTicket.key,
            });
          } catch (error) {
            this.logger.error('Failed to create Jira ticket', {
              error: error instanceof Error ? error.message : String(error),
              service_account,
            });
            results.push({
              status: 'error',
              message: 'Failed to create Jira ticket',
              service_account,
            });
            continue;
          }
        }

        const updatePayload = {
          sign_off_status: item.sign_off_status ?? existing.sign_off_status,
          sign_off_by: item.sign_off_by ?? existing.sign_off_by,
          sign_off_date: item.sign_off_date ?? existing.sign_off_date,
          // Always clear ticket fields and comments on approval
          comments:
            sign_off_status === 'approved'
              ? null
              : comments ?? existing.comments,
          ticket_reference:
            sign_off_status === 'approved'
              ? null
              : item.ticket_reference ?? existing.ticket_reference,
          revoked_date:
            sign_off_status === 'rejected' ? this.db.fn.now() : null,
          ticket_status:
            sign_off_status === 'approved'
              ? null
              : item.ticket_status ?? existing.ticket_status,
          updated_at: this.db.fn.now(),
        };

        await trx('service_account_access_review')
          .where({
            service_account,
            app_name: app_name || existing.app_name,
            frequency: frequency || existing.frequency,
            period: period || existing.period,
            source: source || existing.source,
          })
          .update(updatePayload);

        results.push({
          status: 'updated',
          service_account,
        });
      }

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      this.logger.error('Error updating service account access review data', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }

    return results;
  }

  /**
   * Retrieves service account review data for approved and rejected access.
   *
   * @param appname - Name of the application
   * @param frequency - Review frequency
   * @param period - Review period
   * @returns Promise resolving to ReviewData containing approved and rejected items
   */
  async getServiceAccountReviewData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any> {
    const approved = await this.db('service_account_access_review')
      .select(
        'user_id',
        'full_name',
        'environment',
        'user_role',
        'manager_name',
        'updated_at',
        'source',
      )
      .where({
        app_name: appname,
        frequency,
        period,
        sign_off_status: 'approved',
      });

    const rejected = await this.db('service_account_access_review')
      .select(
        'user_id',
        'full_name',
        'environment',
        'user_role',
        'manager_name',
        'updated_at',
        'source',
      )
      .where({
        app_name: appname,
        frequency,
        period,
        sign_off_status: 'rejected',
      });

    return {
      approved,
      rejected,
    };
  }
}
