import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import axios from 'axios';
import { Knex } from 'knex';
import {
  JiraIssueStatusResponse,
  JiraRequestBody,
} from '../AuditComplianceDatabase.types';
import { addJiraComment } from '../integrations/JiraIntegration';
import { JiraIssueType, CONTENT_TYPE_JSON } from './operations.types';

export class JiraOperations {
  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {}

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
      `Parent Story for ${titleCaseAppName} ${formattedPeriod} ${formattedFrequency} Access Review Audit. This audit covers user access reviews, service account reviews, and compliance checks.`;

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

    // Handle components and labels for Story tickets
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
        issuetype: { name: 'Story' as JiraIssueType },
        labels: [
          `${app_name}-${period}-${frequency}-Story`,
          'audit-compliance-plugin',
          ...extraLabels,
        ],
        // Hardcoded epic link for testing - replace with actual epic key when available
        customfield_12311140: 'APD-1092', // Parent Epic Link - hardcoded for testing
        ...(components ? { components } : {}),
        ...otherFields,
      },
    };

    this.logger.info('STORY: Jira ticket request body', { requestBody });

    let createResp;
    try {
      createResp = await axios.post(
        `${jiraUrl}/rest/api/latest/issue`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            'Content-Type': CONTENT_TYPE_JSON,
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

    // Store the story key in application_audits table
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

      const parentStoryKey = await this.getAuditJiraKey(
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
          issuetype: { name: 'Task' as JiraIssueType },
          labels: [
            `${appName}-${period}-${frequency}-Service-Account-Review`,
            'audit-compliance-plugin',
          ],
          ...jira_metadata,
        },
        // Add issue linking to request body
        ...(parentStoryKey?.trim()
          ? {
              update: {
                issuelinks: [
                  {
                    add: {
                      type: {
                        name: 'Depend',
                      },
                      inwardIssue: {
                        key: parentStoryKey.trim(),
                      },
                    },
                  },
                ],
              },
            }
          : {}),
      };

      // Create Jira ticket
      const createResp = await axios
        .post(`${jiraUrl}/rest/api/latest/issue`, requestBody, {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            'Content-Type': CONTENT_TYPE_JSON,
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
      // const issueKey = 'APD-1094';
      // const issueId = 'APD-1094';
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
        .where({
          service_account,
          app_name: appName,
          frequency,
          period,
        })
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

      const parentStoryKey = await this.getAuditJiraKey(
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
          issuetype: { name: 'Task' as JiraIssueType },
          labels: [
            `${app_name}-${period}-${frequency}`,
            'audit-compliance-plugin',
          ],
          ...jira_metadata,
        },
        // Add issue linking to request body
        ...(parentStoryKey?.trim()
          ? {
              update: {
                issuelinks: [
                  {
                    add: {
                      type: {
                        name: 'Depend',
                      },
                      inwardIssue: {
                        key: parentStoryKey.trim(),
                      },
                    },
                  },
                ],
              },
            }
          : {}),
      };

      // Create Jira ticket
      const createResp = await axios
        .post(`${jiraUrl}/rest/api/latest/issue`, requestBody, {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            'Content-Type': CONTENT_TYPE_JSON,
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
    app_name?: string,
    frequency?: string,
    period?: string,
  ) {
    if (!comments || !ticket_reference) {
      throw new Error('Missing comment or ticket reference.');
    }

    // Add comment to Jira
    await addJiraComment(ticket_reference, comments, this.logger, this.config);

    // Update comment in the service_account_access_review table
    if (app_name && frequency && period) {
      // Use composite key for more precise update
      await this.db('service_account_access_review')
        .where({
          id,
          app_name,
          frequency,
          period,
        })
        .update({ comments });
    } else {
      // Fallback to id-only update for backward compatibility
      await this.db('service_account_access_review')
        .where({ id })
        .update({ comments });
    }

    this.logger.info(
      `Successfully added comment to Jira ticket ${ticket_reference} and updated service account database.`,
    );
  }
}
