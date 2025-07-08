import {
  LoggerService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import axios from 'axios';
import { Knex } from 'knex';
import { addJiraComment, checkAndUpdateJiraStatuses } from './JiraIntegration';
import {
  JiraIssueStatusResponse,
  JiraRequestBody,
  ReviewData,
} from './AuditComplianceDatabase.types';
import { JsonObject } from '@backstage/types';
import { Config } from '@backstage/config';

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-audit-compliance-backend',
  'migrations',
);

/**
 * Main database class for audit compliance.
 * Handles all database operations for audit compliance including:
 * - Application management
 * - Access reviews
 * - Audit records
 * - Activity tracking
 * - Jira integration
 */
export class AuditComplianceDatabase {
  private readonly db: Knex;
  private readonly logger: LoggerService;
  private readonly config: Config;

  private constructor(knex: Knex, logger: LoggerService, config: Config) {
    this.db = knex;
    this.logger = logger;
    this.config = config;
  }

  /**
   * Creates a new instance of AuditComplianceDatabase.
   * Initializes the database connection and runs migrations if needed.
   *
   * @param options - Configuration options for database initialization
   * @param options.knex - Knex database instance
   * @param options.skipMigrations - Whether to skip running migrations
   * @param options.logger - Logger service for logging operations
   * @param options.config - Config object for accessing configuration
   * @returns Promise resolving to a new AuditComplianceDatabase instance
   */
  static async create(options: {
    knex: Knex;
    skipMigrations: boolean;
    logger: LoggerService;
    config: Config;
  }): Promise<AuditComplianceDatabase> {
    const database = options.knex;

    if (!options.skipMigrations) {
      await database.migrate.latest({ directory: migrationsDir });
    }

    return new AuditComplianceDatabase(
      database,
      options.logger,
      options.config,
    );
  }

  /**
   * Retrieves all unique applications from the database.
   * Returns one representative row per application with key details.
   *
   * @returns Promise resolving to array of application records containing:
   *          - app_name: Name of the application
   *          - app_owner: Owner of the application
   *          - app_delegate: Delegate for the application
   *          - cmdb_id: CMDB identifier
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
   * Inserts a new application record into the database.
   *
   * @param appData - Object containing application data to insert
   * @returns Promise resolving to the ID of the newly inserted application
   */
  async insertApplication(appData: any) {
    const [id] = await this.db('applications').insert(appData).returning('id');
    this.logger.info('Inserted new application', { id });
    return id;
  }

  /**
   * Updates an existing application record in the database.
   *
   * @param id - Numeric ID of the application to update
   * @param updateData - Object containing fields to update
   * @returns Promise resolving to the number of updated rows
   */
  async updateApplication(id: number, updateData: any) {
    this.logger.debug('Updating application', { id, updateData });
    return this.db('applications').where({ id }).update(updateData);
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
        access_change_date: item.access_change_date || null,
      };

      this.logger.debug('Updating Access Review', { recordData });

      if (existing) {
        // Check if sign_off_status has changed
        if (sign_off_status && sign_off_status !== existing.sign_off_status) {
          // Create activity stream event for status change
          await this.createActivityEvent({
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
   * Retrieves all audit records from the database.
   * Optionally filters by app_name, frequency, and period.
   *
   * @param params - Optional query parameters
   * @param params.app_name - Name of the application
   * @param params.frequency - Audit frequency
   * @param params.period - Audit period
   * @returns Promise resolving to array of audit records
   */
  async getAllAudits(params?: {
    app_name?: string;
    frequency?: string;
    period?: string;
  }) {
    this.logger.debug('Fetching audits', { params });
    let query = this.db('application_audits').select();

    if (params) {
      const { app_name, frequency, period } = params;
      if (app_name) {
        query = query.where('app_name', app_name);
      }
      if (frequency) {
        query = query.where('frequency', frequency);
      }
      if (period) {
        query = query.where('period', period);
      }
    }

    return query;
  }

  /**
   * Creates a new audit record with default 'audit_started' progress.
   *
   * @param auditData - Object containing audit data to insert
   * @returns Promise resolving to the ID of the newly created audit
   */
  async insertAudit(auditData: any) {
    const auditWithProgress = {
      ...auditData,
      progress: 'audit_started', // Set default progress when creating new audit
    };
    const [id] = await this.db('application_audits')
      .insert(auditWithProgress)
      .returning('id');
    this.logger.info('Inserted new audit', { id });
    return id;
  }

  /**
   * Updates an existing audit record with new data.
   * Validates progress values against allowed states.
   *
   * @param app_name - Name of the application
   * @param frequency - Audit frequency
   * @param period - Audit period
   * @param updateData - Object containing fields to update
   * @returns Promise resolving to the number of updated rows
   * @throws Error if progress value is invalid
   */
  async updateAudit(
    app_name: string,
    frequency: string,
    period: string,
    updateData: any,
  ) {
    this.logger.info('Updating audit', {
      app_name,
      frequency,
      period,
      updateData,
    });
    // Ensure progress is one of the allowed values
    if (
      updateData.progress &&
      ![
        'audit_started',
        'details_under_review',
        'final_sign_off_done',
        'summary_generated',
        'completed',
      ].includes(updateData.progress)
    ) {
      throw new Error('Invalid progress value');
    }
    return this.db('application_audits')
      .where({ app_name, frequency, period })
      .update(updateData);
  }

  /**
   * Updates the progress status of an audit and creates corresponding activity events.
   *
   * @param app_name - Name of the application
   * @param frequency - Audit frequency
   * @param period - Audit period
   * @param progress - New progress value
   * @param performed_by - User who performed the action
   * @returns Promise resolving to the number of updated rows
   * @throws Error if audit not found
   */
  async updateAuditProgress(
    app_name: string,
    frequency: string,
    period: string,
    progress:
      | 'audit_started'
      | 'details_under_review'
      | 'summary_generated'
      | 'completed'
      | 'final_sign_off_done',
    performed_by: string = 'system',
  ) {
    this.logger.debug('Updating audit progress', {
      app_name,
      frequency,
      period,
      progress,
      performed_by,
    });

    // Get current audit details
    const audit = await this.db('application_audits')
      .where({ app_name, frequency, period })
      .first();

    if (!audit) {
      throw new Error(
        `Audit not found for app_name: ${app_name}, frequency: ${frequency}, period: ${period}`,
      );
    }

    // Create activity stream event based on progress
    let eventType: string;
    switch (progress) {
      case 'audit_started':
        eventType = 'AUDIT_INITIATED';
        break;
      case 'completed':
        eventType = 'AUDIT_COMPLETED';
        break;
      case 'summary_generated':
        eventType = 'AUDIT_SUMMARY_GENERATED';
        break;
      case 'final_sign_off_done':
        eventType = 'AUDIT_FINAL_SIGNOFF_COMPLETED';
        break;
      default:
        eventType = 'AUDIT_PROGRESS_UPDATED';
    }

    await this.createActivityEvent({
      event_type: eventType,
      app_name,
      frequency,
      period,
      performed_by,
      metadata: {
        previous_progress: audit.progress,
        new_progress: progress,
        jira_key: audit.jira_key,
      },
    });

    // Update using app_name, frequency, and period as the key
    const updateData: any = {
      progress,
      updated_at: this.db.fn.now(),
    };

    // Set status to access_review_complete when final sign-off is done
    if (progress === 'final_sign_off_done') {
      updateData.status = 'access_review_complete';
    }

    const result = await this.db('application_audits')
      .where({ app_name, frequency, period })
      .update(updateData);

    if (result === 0) {
      throw new Error('Failed to update audit progress');
    }

    return result;
  }

  /**
   * Finds an audit record by application name, frequency, and period.
   *
   * @param appName - Name of the application
   * @param frequency - Audit frequency
   * @param period - Audit period
   * @returns Promise resolving to the matching audit record or null if not found
   */
  async findAuditByAppNamePeriod(
    appName: string,
    frequency: string,
    period: string,
  ) {
    this.logger.debug('Fetching audit by app name, frequency, and period', {
      appName,
      frequency,
      period,
    });
    return await this.db('application_audits')
      .where({ app_name: appName, frequency, period })
      .first();
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
   * Creates a Jira ticket for service account access review and updates the database.
   *
   * @param params - Parameters for ticket creation
   * @param params.service_account - Name of the service account
   * @param params.appName - Application name
   * @param params.frequency - Review frequency
   * @param params.period - Review period
   * @param params.title - Ticket title
   * @param params.description - Ticket description
   * @param params.comments - Additional comments
   * @param params.manager_uid - Manager UID for constructing email address
   * @param params.current_user_uid - Current user UID for fallback email
   * @param params.manager_name - Manager name for enhanced description
   * @returns Promise resolving to created Jira ticket details
   * @throws Error if Jira project not found or ticket creation fails
   */
  async createServiceAccountJiraTicket({
    service_account,
    appName,
    frequency,
    period,
    title,
    description,
    comments,
    manager_uid,
    current_user_uid,
    manager_name,
  }: {
    service_account: string;
    appName: string;
    frequency: string;
    period: string;
    title: string;
    description: string;
    comments: string;
    manager_uid?: string;
    current_user_uid?: string;
    manager_name?: string;
  }) {
    const jiraUrl = this.config.getString('auditCompliance.jiraUrl');
    const jiraToken = this.config.getString('auditCompliance.jiraToken');
    try {
      this.logger.info('Creating Service Account Jira ticket', {
        service_account,
        appName,
        frequency,
        period,
        manager_name,
        manager_uid,
        current_user_uid,
      });

      const jira_project = await this.getJiraProjectByAppName(appName);
      if (!jira_project) {
        throw new Error(`Jira project not found for app_name: ${appName}`);
      }

      const parentEpicKey = await this.getAuditJiraKey(
        appName,
        frequency,
        period,
      );

      // Enhance description with manager information if available
      const enhancedDescription = manager_name
        ? `${description}\n\n*Manager:* ${manager_name}`
        : description;

      const requestBody: JiraRequestBody = {
        fields: {
          project: { key: jira_project },
          summary: title,
          description: enhancedDescription,
          issuetype: { name: 'Task' },
          labels: [
            `${appName}-${period}-${frequency}-Service-Account-Review`,
            'audit-compliance-plugin',
          ],
        },
      };
      if (parentEpicKey?.trim()) {
        requestBody.fields.customfield_12311140 = parentEpicKey.trim();
      }

      // Create Jira ticket
      const createResp = await axios
        .post(`${jiraUrl}/rest/api/latest/issue`, requestBody, {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            'Content-Type': 'application/json',
          },
        })
        .catch(error => {
          this.logger.error('Failed to create Jira ticket', {
            error: error.response?.data || error.message,
            status: error.response?.status,
          });
          throw new Error(
            `Failed to create Jira ticket: ${
              error.response?.data?.message || error.message
            }`,
          );
        });

      const { key: issueKey, id: issueId } = createResp.data;

      // Get ticket status
      const detailsResp = await axios
        .get<JiraIssueStatusResponse>(
          `${jiraUrl}/rest/api/latest/issue/${issueKey}`,
          {
            headers: {
              Authorization: `Bearer ${jiraToken}`,
              Accept: 'application/json',
            },
          },
        )
        .catch(error => {
          this.logger.error('Failed to get Jira ticket status', {
            error: error.response?.data || error.message,
            status: error.response?.status,
          });
          throw new Error(
            `Failed to get Jira ticket status: ${
              error.response?.data?.message || error.message
            }`,
          );
        });

      const status = detailsResp.data.fields.status.name;

      // Add comments if provided
      if (comments) {
        await axios
          .post(
            `${jiraUrl}/rest/api/latest/issue/${issueKey}/comment`,
            { body: comments },
            {
              headers: {
                Authorization: `Bearer ${jiraToken}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .catch(error => {
            this.logger.error('Failed to add comment to Jira ticket', {
              error: error.response?.data || error.message,
              status: error.response?.status,
            });
            // Don't throw here, as the ticket was created successfully
            this.logger.warn(
              'Comment could not be added, but ticket was created',
            );
          });
      }

      // Update database
      await this.db('service_account_access_review')
        .where({ service_account })
        .update({
          ticket_reference: issueKey,
          ticket_status: status,
          updated_at: this.db.fn.now(),
        })
        .catch(error => {
          this.logger.error('Failed to update database', {
            error: error.message,
            service_account,
          });
          throw new Error(`Failed to update database: ${error.message}`);
        });

      return {
        id: issueId,
        key: issueKey,
        status,
        self: `${jiraUrl}/rest/api/latest/issue/${issueKey}`,
      };
    } catch (error) {
      this.logger.error('Error in createServiceAccountJiraTicket', {
        error: error instanceof Error ? error.message : String(error),
        service_account,
        appName,
      });
      throw error;
    }
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

        // Check if sign_off_status has changed
        if (
          sign_off_status &&
          sign_off_status.toLowerCase() !==
            existing.sign_off_status?.toLowerCase()
        ) {
          // Create activity stream event for status change
          await this.createActivityEvent({
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
            const jiraTicket = await this.createServiceAccountJiraTicket({
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
          comments: comments ?? existing.comments,
          ticket_reference: existing.ticket_reference,
          date_of_access_revoked:
            item.date_of_access_revoked ?? existing.date_of_access_revoked,
          ticket_status: existing.ticket_status,
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
      this.logger.error('Error updating service account access review data', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }

    return results;
  }

  /**
   * Retrieves the Jira project key associated with an application.
   *
   * @param appName - Name of the application
   * @returns Promise resolving to Jira project key or null if not found
   * @throws Error if database query fails
   */
  async getJiraProjectByAppName(appName: string): Promise<string | null> {
    try {
      const result = await this.db('applications')
        .select('jira_project')
        .where({ app_name: appName })
        .first();

      return result?.jira_project || null;
    } catch (error) {
      this.logger.error(`Error fetching Jira project for app: ${appName}`, {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw new Error('Failed to fetch Jira project key from DB');
    }
  }

  /**
   * Retrieves the Jira key for an audit from the application audits table.
   *
   * @param appName - Name of the application
   * @param frequency - Audit frequency
   * @param period - Audit period
   * @returns Promise resolving to Jira key or null if not found
   * @throws Error if database query fails
   */
  async getAuditJiraKey(
    appName: string,
    frequency: string,
    period: string,
  ): Promise<string | null> {
    try {
      const result = await this.db('application_audits')
        .select('jira_key')
        .where({ app_name: appName, frequency, period })
        .first();

      return result?.jira_key || null;
    } catch (error) {
      this.logger.error(`Error fetching audit Jira key for app: ${appName}`, {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw new Error('Failed to fetch audit Jira key from DB');
    }
  }
  /*
   * Converts a hyphen-separated string to Title Case with spaces
   * @param str - The string to convert
   * @returns The string in Title Case format with spaces
   */
  private toTitleCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Creates a Jira ticket for AQR (Access Quality Review) and updates the database.
   *
   * @param params - Parameters for ticket creation
   * @param params.user_id - User ID
   * @param params.app_name - Application name
   * @param params.period - Review period
   * @param params.frequency - Review frequency
   * @param params.title - Ticket title
   * @param params.description - Ticket description
   * @param params.comments - Additional comments
   * @param params.manager_name - Manager name
   * @param params.manager_uid - Manager UID for constructing email address
   * @param params.current_user_uid - Current user UID for fallback email
   * @returns Promise resolving to created Jira ticket details
   * @throws Error if Jira project not found or ticket creation fails
   */
  async createAqrJiraTicketAndUpdateStatus({
    user_id,
    app_name,
    period,
    frequency,
    title,
    description,
    comments,
    manager_name,
    manager_uid,
    current_user_uid,
  }: {
    user_id: string;
    app_name: string;
    period: string;
    frequency: string;
    title: string;
    description: string;
    comments: string;
    manager_name?: string;
    manager_uid?: string;
    current_user_uid?: string;
  }) {
    const jiraUrl = this.config.getString('auditCompliance.jiraUrl');
    const jiraToken = this.config.getString('auditCompliance.jiraToken');
    try {
      this.logger.info('Creating AQR Jira ticket', {
        user_id,
        app_name,
        period,
        frequency,
        manager_name,
        manager_uid,
        current_user_uid,
      });

      const jira_project = await this.getJiraProjectByAppName(app_name);
      if (!jira_project) {
        throw new Error(`Jira project not found for app_name: ${app_name}`);
      }

      const parentEpicKey = await this.getAuditJiraKey(
        app_name,
        frequency,
        period,
      );

      const requestBody: JiraRequestBody = {
        fields: {
          project: { key: jira_project },
          summary: title,
          description: description,
          issuetype: { name: 'Task' },
          labels: [
            `${app_name}-${period}-${frequency}`,
            'audit-compliance-plugin',
          ],
        },
      };

      if (parentEpicKey?.trim()) {
        requestBody.fields.customfield_12311140 = parentEpicKey.trim();
      }

      // Create Jira ticket
      const createResp = await axios
        .post(`${jiraUrl}/rest/api/latest/issue`, requestBody, {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            'Content-Type': 'application/json',
          },
        })
        .catch(error => {
          this.logger.error('Failed to create Jira ticket', {
            error: error instanceof Error ? error.message : String(error),
            status: (error as any)?.response?.status,
            requestBody,
          });
          throw new Error(
            `Failed to create Jira ticket: ${
              error.response?.data?.message || error.message
            }`,
          );
        });

      const { key: issueKey, id: issueId } = createResp.data;

      // Get ticket status
      const detailsResp = await axios
        .get<JiraIssueStatusResponse>(
          `${jiraUrl}/rest/api/latest/issue/${issueKey}`,
          {
            headers: {
              Authorization: `Bearer ${jiraToken}`,
              Accept: 'application/json',
            },
          },
        )
        .catch(error => {
          this.logger.error('Failed to get Jira ticket status', {
            error: error.response?.data || error.message,
            status: error.response?.status,
          });
          throw new Error(
            `Failed to get Jira ticket status: ${
              error.response?.data?.message || error.message
            }`,
          );
        });

      const status = detailsResp.data.fields.status.name;

      // Add comments if provided
      if (comments) {
        await axios
          .post(
            `${jiraUrl}/rest/api/latest/issue/${issueKey}/comment`,
            { body: comments },
            {
              headers: {
                Authorization: `Bearer ${jiraToken}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .catch(error => {
            this.logger.error('Failed to add comment to Jira ticket', {
              error: error.response?.data || error.message,
              status: error.response?.status,
            });
            // Don't throw here, as the ticket was created successfully
            this.logger.warn(
              'Comment could not be added, but ticket was created',
            );
          });
      }

      // Update database
      await this.db('group_access_reports')
        .where({
          user_id,
          app_name,
          period,
          frequency,
        })
        .update({
          ticket_reference: issueKey,
          ticket_status: status,
        })
        .catch(error => {
          this.logger.error('Failed to update database', {
            error: error.message,
            user_id,
            app_name,
          });
          throw new Error(`Failed to update database: ${error.message}`);
        });

      return {
        id: issueId,
        key: issueKey,
        status: status,
        self: `${jiraUrl}/rest/api/latest/issue/${issueKey}`,
      };
    } catch (error) {
      this.logger.error('Error in createAqrJiraTicketAndUpdateStatus', {
        error: error instanceof Error ? error.message : String(error),
        user_id,
        app_name,
      });
      throw error;
    }
  }

  /**
   * Creates a Jira ticket for audit initiation and updates the audit record.
   *
   * @param auditData - Audit data containing app_name, frequency, and period
   * @param description - Optional custom description for the Jira ticket
   * @returns Promise resolving to created Jira ticket details
   * @throws Error if Jira project not found or ticket creation fails
   */
  async createAuditJiraTicket(
    auditData: { app_name: string; frequency: string; period: string },
    description?: string,
  ) {
    const jiraUrl = this.config.getString('auditCompliance.jiraUrl');
    const jiraToken = this.config.getString('auditCompliance.jiraToken');
    this.logger.info('Creating Jira ticket for audit initiation', auditData);

    const { app_name, frequency, period } = auditData;
    const titleCaseAppName = this.toTitleCase(app_name);
    const formattedPeriod = period.toUpperCase().replace('-', ' ');
    const formattedFrequency =
      frequency.charAt(0).toUpperCase() + frequency.slice(1);

    const summary = `[${formattedPeriod}] ${titleCaseAppName} ${formattedFrequency} Access Review Audit`;
    const ticketDescription =
      description ||
      `Parent Epic for ${titleCaseAppName} ${formattedPeriod} ${formattedFrequency} Access Review Audit. This audit covers user access reviews, service account reviews, and compliance checks.`;

    const appDetails = await this.db('applications')
      .select('jira_project', 'app_owner', 'app_owner_email')
      .where({ app_name })
      .first();

    if (!appDetails?.jira_project) {
      this.logger.error(`Jira project not found for app_name: ${app_name}`);
      throw new Error(`Jira project not found for app_name: ${app_name}`);
    }

    const requestBody: JiraRequestBody = {
      fields: {
        project: { key: appDetails.jira_project },
        summary,
        description: ticketDescription,
        issuetype: { name: 'Epic' },
        labels: [
          `${app_name}-${period}-${frequency}-Epic`,
          'audit-compliance-plugin',
        ],
        customfield_12311141: summary, // Epic Name (same as summary)
      },
    };

    this.logger.info('Jira ticket request body', { requestBody });

    const createResp = await axios.post(
      `${jiraUrl}/rest/api/latest/issue`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${jiraToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { key: issueKey, id: issueId } = createResp.data;

    const detailsResp = await axios
      .get<JiraIssueStatusResponse>(
        `${jiraUrl}/rest/api/latest/issue/${issueKey}`,
        {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            Accept: 'application/json',
          },
        },
      )
      .catch(error => {
        this.logger.error('Failed to get Jira ticket status', {
          error: error.response?.data || error.message,
          status: error.response?.status,
        });
        throw new Error(
          `Failed to get Jira ticket status: ${
            error.response?.data?.errorMessages?.join(', ') ||
            error.response?.data?.errors?.join(', ') ||
            error.message
          }`,
        );
      });

    const status = detailsResp.data.fields.status.name;

    // Store the epic key in application_audits table
    await this.db('application_audits')
      .where({ app_name, frequency, period })
      .update({
        jira_key: issueKey,
        jira_status: status,
        updated_at: this.db.fn.now(),
      });

    return {
      id: issueId,
      key: issueKey,
      status,
      self: `${jiraUrl}/rest/api/latest/issue/${issueKey}`,
    };
  }

  /**
   * Retrieves application details including source and account information.
   *
   * @param appName - Name of the application
   * @returns Promise resolving to application details or null if not found
   */
  async getApplicationDetails(appName: string) {
    const result = await this.db('applications')
      .select(
        'source',
        'account_name',
        'environment',
        'cmdb_id',
        'jira_project',
        'app_owner_email',
      )
      .where({ app_name: appName })
      .first();

    return result || null;
  }

  /**
   * Retrieves distinct app owners for a specific application.
   *
   * @param appName - Name of the application
   * @returns Promise resolving to array of distinct app owner names
   */
  async getDistinctAppOwners(appName: string): Promise<string[]> {
    this.logger.debug('Fetching distinct app owners for application', {
      appName,
    });
    const results = await this.db('applications')
      .distinct('app_owner')
      .where({ app_name: appName })
      .whereNotNull('app_owner')
      .pluck('app_owner');

    return results.filter(Boolean); // Remove any null/undefined values
  }

  /**
   * Retrieves activity stream events with optional filtering and pagination.
   *
   * @param params - Query parameters
   * @param params.app_name - Name of the application
   * @param params.frequency - Optional frequency filter
   * @param params.period - Optional period filter
   * @param params.limit - Optional limit for number of results
   * @param params.offset - Optional offset for pagination
   * @returns Promise resolving to array of activity events
   */
  async getActivityStreamEvents(params: {
    app_name: string;
    frequency?: string;
    period?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { app_name, frequency, period, limit, offset } = params;

    this.logger.debug('Fetching activity stream events', {
      app_name,
      frequency,
      period,
      limit,
      offset,
    });

    let query = this.db('activity_stream')
      .where('app_name', 'ilike', app_name)
      .orderBy('created_at', 'desc');

    if (frequency) {
      query = query.andWhere('frequency', frequency);
    }
    if (period) {
      query = query.andWhere('period', period);
    }
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    return query.select();
  }

  /**
   * Creates a new activity stream event with application context.
   *
   * @param event - Event data to create
   * @param event.event_type - Type of event
   * @param event.app_name - Name of the application
   * @param event.frequency - Optional frequency
   * @param event.period - Optional period
   * @param event.user_id - Optional user ID
   * @param event.performed_by - User who performed the action
   * @param event.metadata - Optional additional metadata
   * @returns Promise resolving to the created event record
   */
  async createActivityEvent(event: {
    event_type: string;
    app_name: string;
    frequency?: string;
    period?: string;
    user_id?: string;
    performed_by: string;
    metadata?: JsonObject;
  }): Promise<any> {
    this.logger.debug('Creating activity stream event', { event });

    // Get source and account_name from applications table
    const appDetails = await this.db('applications')
      .select('source', 'account_name')
      .where({ app_name: event.app_name })
      .first();

    // Extract metadata fields directly
    const { previous_status, new_status, reason } = event.metadata || {};

    const [createdEvent] = await this.db('activity_stream')
      .insert({
        event_type: event.event_type,
        app_name: event.app_name,
        frequency: event.frequency,
        period: event.period,
        user_id: event.user_id,
        performed_by: event.performed_by,
        source: appDetails?.source || null,
        account_name: appDetails?.account_name || null,
        previous_status: previous_status || null,
        new_status: new_status || null,
        reason: reason || null,
        created_at: this.db.fn.now(),
      })
      .returning('*');

    return createdEvent;
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
        status: 'approved',
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
        status: 'rejected',
      });

    return {
      approved,
      rejected,
    };
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
  ): Promise<ReviewData> {
    const approved = await this.db('service_account_access_review')
      .select(
        'user_id',
        'full_name',
        'environment',
        'user_role',
        'manager_name',
        'updated_at',
      )
      .where({
        app_name: appname,
        frequency,
        period,
        status: 'approved',
      });

    const rejected = await this.db('service_account_access_review')
      .select(
        'user_id',
        'full_name',
        'environment',
        'user_role',
        'manager_name',
        'updated_at',
      )
      .where({
        app_name: appname,
        frequency,
        period,
        status: 'rejected',
      });

    return {
      approved,
      rejected,
    };
  }

  /**
   * Retrieves audit metadata for a specific audit.
   *
   * @param auditId - ID of the audit
   * @returns Promise resolving to audit metadata or null if not found
   */
  async getAuditMetadata(auditId: number) {
    this.logger.debug('Fetching audit metadata', { auditId });
    return await this.db('audit_metadata').where({ audit_id: auditId }).first();
  }

  /**
   * Updates or creates audit metadata for a specific audit.
   *
   * @param auditId - ID of the audit
   * @param metadata - Object containing documentation_evidence and auditor_notes
   * @returns Promise resolving to the updated/created metadata record
   */
  async updateAuditMetadata(
    auditId: number,
    metadata: {
      documentation_evidence: JsonObject;
      auditor_notes: JsonObject;
    },
  ) {
    this.logger.debug('Updating audit metadata', { auditId, metadata });

    // Check if metadata record exists
    const existing = await this.db('audit_metadata')
      .where({ audit_id: auditId })
      .first();

    if (existing) {
      // Update existing record
      const [updated] = await this.db('audit_metadata')
        .where({ audit_id: auditId })
        .update({
          documentation_evidence: metadata.documentation_evidence,
          auditor_notes: metadata.auditor_notes,
          updated_at: this.db.fn.now(),
        })
        .returning('*');

      return updated;
    }

    // Create new record
    const [created] = await this.db('audit_metadata')
      .insert({
        audit_id: auditId,
        documentation_evidence: metadata.documentation_evidence,
        auditor_notes: metadata.auditor_notes,
      })
      .returning('*');

    return created;
  }

  /**
   * Creates a new application with multiple account entries.
   * Handles the insertion of both application details and associated account entries.
   *
   * @param appData - Application data including main details and account entries
   * @param appData.app_name - Name of the application
   * @param appData.cmdb_id - CMDB identifier
   * @param appData.environment - Environment (e.g., production)
   * @param appData.app_owner - Application owner
   * @param appData.app_owner_email - Application owner email
   * @param appData.app_delegate - Application delegate
   * @param appData.jira_project - Jira project key
   * @param appData.accounts - Array of account entries
   * @returns Promise resolving to the created application ID and account entries
   */
  async createApplicationWithAccounts(appData: {
    app_name: string;
    cmdb_id: string;
    environment: string;
    app_owner: string;
    app_owner_email: string;
    app_delegate: string;
    jira_project: string;
    accounts: Array<{
      type: 'service-account' | 'rover-group-name';
      source: 'rover' | 'gitlab';
      account_name: string;
    }>;
  }) {
    const trx = await this.db.transaction();

    try {
      // Insert all entries into applications table
      const entries = appData.accounts.map(account => {
        const entry: any = {
          app_name: appData.app_name,
          cmdb_id: appData.cmdb_id,
          environment: appData.environment,
          app_owner: appData.app_owner,
          app_owner_email: appData.app_owner_email,
          app_delegate: appData.app_delegate,
          jira_project: appData.jira_project,
          type: account.type,
          source: account.source,
          account_name: account.account_name,
          created_at: this.db.fn.now(),
        };

        return entry;
      });

      // Insert all entries
      const insertedIds = await trx('applications')
        .insert(entries)
        .returning('id');

      await trx.commit();

      // Create activity event for application creation
      await this.createActivityEvent({
        event_type: 'APPLICATION_CREATED',
        app_name: appData.app_name,
        performed_by: 'system',
        metadata: {
          cmdb_id: appData.cmdb_id,
          environment: appData.environment,
          account_count: appData.accounts.length,
        },
      });

      return {
        ids: insertedIds,
        app_name: appData.app_name,
        accounts: appData.accounts,
      };
    } catch (error) {
      await trx.rollback();
      this.logger.error('Error creating application with accounts', {
        error: error instanceof Error ? error.message : String(error),
        app_name: appData.app_name,
      });
      throw error;
    }
  }

  /**
   * Adds a comment to a Jira ticket and updates the comment in the local database.
   *
   * @param id - The ID of the access review record
   * @param comments - The comment to add
   * @param ticket_reference - The Jira ticket reference
   * @param table - The table to update ('group_access_reports' or 'service_account_access_review')
   */
  async addJiraCommentAndUpdateDb(
    id: number,
    comments: string,
    ticket_reference: string,
    table:
      | 'group_access_reports'
      | 'service_account_access_review' = 'group_access_reports',
  ) {
    if (!comments || !ticket_reference) {
      throw new Error('Missing comment or ticket reference.');
    }

    // Add comment to Jira
    await addJiraComment(ticket_reference, comments, this.logger, this.config);

    // Update comment in the correct database table
    await this.db(table).where({ id }).update({ comments });

    this.logger.info(
      `Successfully added comment to Jira ticket ${ticket_reference} and updated database (${table}).`,
    );
  }

  /**
   * Adds a comment to a Jira ticket and updates the comment in the service_account_access_review table.
   *
   * @param id - The ID of the service account access review record
   * @param comments - The comment to add
   * @param ticket_reference - The Jira ticket reference
   */
  async addServiceAccountJiraCommentAndUpdateDb(
    id: number,
    comments: string,
    ticket_reference: string,
  ) {
    if (!comments || !ticket_reference) {
      throw new Error('Missing comment or ticket reference.');
    }

    // Add comment to Jira
    await addJiraComment(ticket_reference, comments, this.logger, this.config);

    // Update comment in the service_account_access_review table
    await this.db('service_account_access_review')
      .where({ id })
      .update({ comments });

    this.logger.info(
      `Successfully added comment to Jira ticket ${ticket_reference} and updated service account database.`,
    );
  }
}
