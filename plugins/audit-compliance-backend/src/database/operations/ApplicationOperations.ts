import { LoggerService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { Config } from '@backstage/config';
import {
  fetchJiraFieldSchemas,
  transformJiraMetadataForStorage,
} from '../integrations/JiraIntegration';
import { AccountType, AccountSource, EventType } from './operations.types';
import { ActivityStreamOperations } from './ActivityStreamOperations';

export class ApplicationOperations {
  private readonly activityStreamOps: ActivityStreamOperations;

  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {
    this.activityStreamOps = new ActivityStreamOperations(db, logger);
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
      .select(
        'app_name',
        'app_owner',
        'app_owner_email',
        'app_delegate',
        'cmdb_id',
      )
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
      type: AccountType;
      source: AccountSource;
      account_name: string;
      custom_reviewer?: string;
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
        if (account.custom_reviewer) {
          entry.custom_reviewer = account.custom_reviewer;
        }
        return entry;
      });

      // Insert all entries
      const insertedIds = await trx('applications')
        .insert(entries)
        .returning('id');

      await trx.commit();

      // Create activity event for application creation
      await this.activityStreamOps.createActivityEvent({
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
      type: AccountType;
      source: AccountSource;
      account_name: string;
      custom_reviewer?: string;
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
        if (account.custom_reviewer) {
          entry.custom_reviewer = account.custom_reviewer;
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
        await this.activityStreamOps.createActivityEvent({
          event_type: 'APPLICATION_UPDATED' as EventType,
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
        'custom_reviewer',
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
}
