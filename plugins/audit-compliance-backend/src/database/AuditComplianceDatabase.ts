import {
  LoggerService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import axios from 'axios';
import { Knex } from 'knex';
import {
  addJiraComment,
  checkAndUpdateJiraStatuses,
  transformJiraMetadataForStorage,
  fetchJiraFieldSchemas,
} from './JiraIntegration';
import {
  JiraIssueStatusResponse,
  JiraRequestBody,
  ReviewData,
} from './AuditComplianceDatabase.types';
import { JsonObject } from '@backstage/types';
import { Config } from '@backstage/config';

const migrationsDir = resolvePackagePath(
  '@appdev/backstage-plugin-audit-compliance-backend',
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

      // Fetch jira_metadata from applications table
      const appRecord = await this.db('applications')
        .select('jira_metadata')
        .where({ app_name: appName })
        .first();

      const jira_metadata = appRecord?.jira_metadata || {};

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
          ...jira_metadata,
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
      console.log('TASK:JIRA - service account', requestBody);
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

      // Fetch jira_metadata from applications table
      const appRecord = await this.db('applications')
        .select('jira_metadata')
        .where({ app_name })
        .first();

      const jira_metadata = appRecord?.jira_metadata || {};

      // 4. Build request body including jira_metadata
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
          ...jira_metadata,
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

      // Update database with ticket reference and status
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

    // Fetch jira_metadata from applications table
    const appDetails = await this.db('applications')
      .select('jira_project', 'app_owner', 'app_owner_email', 'jira_metadata')
      .where({ app_name })
      .first();

    if (!appDetails?.jira_project) {
      this.logger.error(`Jira project not found for app_name: ${app_name}`);
      throw new Error(`Jira project not found for app_name: ${app_name}`);
    }

    // Get jira_metadata from database
    const jira_metadata = appDetails.jira_metadata || {};

    // Handle components and labels for Epic tickets
    const components = jira_metadata.components;
    let extraLabels = [];

    if (jira_metadata.labels) {
      extraLabels = Array.isArray(jira_metadata.labels)
        ? jira_metadata.labels
        : [jira_metadata.labels];
    }

    // Remove components and labels from jira_metadata to avoid duplication
    const { components: _c, labels: _l, ...otherFields } = jira_metadata;

    const requestBody: JiraRequestBody = {
      fields: {
        project: { key: appDetails.jira_project },
        summary,
        description: ticketDescription,
        issuetype: { name: 'Epic' },
        labels: [
          `${app_name}-${period}-${frequency}-Epic`,
          'audit-compliance-plugin',
          ...extraLabels,
        ],
        customfield_12311141: summary, // Epic Name (same as summary)
        ...(components ? { components } : {}),
        ...otherFields,
      },
    };

    this.logger.info('EPIC: Jira ticket request body', { requestBody });

    let createResp;
    try {
      createResp = await axios.post(
        `${jiraUrl}/rest/api/latest/issue`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Jira ticket creation failed', {
          data: error.response?.data,
          status: error.response?.status,
        });
      } else {
        this.logger.error('Jira ticket creation failed', {
          error: String(error),
        });
      }
      throw error;
    }

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
    const appRows = await this.db('applications')
      .select(
        'source',
        'account_name',
        'environment',
        'cmdb_id',
        'jira_project',
        'app_owner_email',
        'jira_metadata',
      )
      .where({ app_name: appName });

    if (!appRows || appRows.length === 0) return null;
    // Prefer a row with jira_metadata, fallback to first row
    const appDetails = appRows.find(row => row.jira_metadata) || appRows[0];
    return appDetails;
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

    // Only filter by frequency and period if they are provided AND not null/undefined
    // This allows application-level events (without frequency/period) to be included
    if (frequency && frequency.trim() !== '') {
      query = query.andWhere(function () {
        this.where('frequency', frequency).orWhereNull('frequency');
      });
    }
    if (period && period.trim() !== '') {
      query = query.andWhere(function () {
        this.where('period', period).orWhereNull('period');
      });
    }
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    const events = await query.select();

    this.logger.info('Activity stream events retrieved', {
      app_name,
      frequency,
      period,
      total_events: events.length,
      event_types: events.map(e => e.event_type),
    });

    return events;
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
   * @param appData.jira_metadata - Raw Jira metadata from form (will be transformed)
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
      source: 'rover' | 'gitlab' | 'ldap';
      account_name: string;
    }>;
    jira_metadata?: Record<string, string | { value: string; schema?: any }>;
    performed_by?: string;
  }) {
    const trx = await this.db.transaction();

    try {
      // Transform Jira metadata from user input to Jira-compatible format
      let transformedJiraMetadata: Record<string, any> = {};
      if (appData.jira_metadata) {
        // Try to fetch field schemas for accurate transformation
        let fieldSchemas: Record<string, any> | undefined;
        try {
          fieldSchemas = await fetchJiraFieldSchemas(this.logger, this.config);
        } catch (error) {
          this.logger.warn(
            'Failed to fetch field schemas, using pattern matching',
            {
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }

        transformedJiraMetadata = transformJiraMetadataForStorage(
          appData.jira_metadata,
          fieldSchemas,
          this.logger,
        );
        this.logger.info('Transformed Jira metadata for storage', {
          app_name: appData.app_name,
          original: appData.jira_metadata,
          transformed: transformedJiraMetadata,
          schemasUsed: !!fieldSchemas,
        });
      }

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
        if (Object.keys(transformedJiraMetadata).length > 0) {
          entry.jira_metadata = transformedJiraMetadata;
        }
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
        performed_by: appData.performed_by || 'system',
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
        jira_metadata: transformedJiraMetadata,
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
   * Updates an existing application with multiple account entries.
   * Handles the deletion of existing entries and insertion of new ones.
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
   * @param appData.jira_metadata - Raw Jira metadata from form (will be transformed)
   * @returns Promise resolving to the updated application data
   */
  async updateApplicationWithAccounts(appData: {
    app_name: string;
    cmdb_id: string;
    environment: string;
    app_owner: string;
    app_owner_email: string;
    app_delegate: string;
    jira_project: string;
    accounts: Array<{
      type: 'service-account' | 'rover-group-name';
      source: 'rover' | 'gitlab' | 'ldap';
      account_name: string;
    }>;
    jira_metadata?: Record<string, string | { value: string; schema?: any }>;
    performed_by?: string;
  }) {
    const trx = await this.db.transaction();

    try {
      // Transform Jira metadata from user input to Jira-compatible format
      let transformedJiraMetadata: Record<string, any> = {};
      if (appData.jira_metadata) {
        // Try to fetch field schemas for accurate transformation
        let fieldSchemas: Record<string, any> | undefined;
        try {
          fieldSchemas = await fetchJiraFieldSchemas(this.logger, this.config);
        } catch (error) {
          this.logger.warn(
            'Failed to fetch field schemas, using pattern matching',
            {
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }

        transformedJiraMetadata = transformJiraMetadataForStorage(
          appData.jira_metadata,
          fieldSchemas,
          this.logger,
        );
        this.logger.info('Transformed Jira metadata for update', {
          app_name: appData.app_name,
          original: appData.jira_metadata,
          transformed: transformedJiraMetadata,
          schemasUsed: !!fieldSchemas,
        });
      }

      // Delete existing entries for this application
      await trx('applications').where({ app_name: appData.app_name }).del();

      // Insert new entries into applications table
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
        if (Object.keys(transformedJiraMetadata).length > 0) {
          entry.jira_metadata = transformedJiraMetadata;
        }
        return entry;
      });

      // Insert all new entries
      const insertedIds = await trx('applications')
        .insert(entries)
        .returning('id');

      await trx.commit();

      // Create activity event for application update
      try {
      await this.createActivityEvent({
        event_type: 'APPLICATION_UPDATED',
        app_name: appData.app_name,
          performed_by: appData.performed_by || 'system',
        metadata: {
          cmdb_id: appData.cmdb_id,
          environment: appData.environment,
          account_count: appData.accounts.length,
        },
      });
      } catch (error) {
        this.logger.error(
          'Failed to create activity event for application update',
          {
            error: error instanceof Error ? error.message : String(error),
            app_name: appData.app_name,
          },
        );
        // Don't throw the error to avoid breaking the application update
      }

      return {
        ids: insertedIds,
        app_name: appData.app_name,
        accounts: appData.accounts,
        jira_metadata: transformedJiraMetadata,
      };
    } catch (error) {
      await trx.rollback();
      this.logger.error('Error updating application with accounts', {
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

  public getLogger() {
    return this.logger;
  }
  public getConfig() {
    return this.config;
  }

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
