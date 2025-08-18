import { LoggerService } from '@backstage/backend-plugin-api';
import { JsonObject } from '@backstage/types';
import { Knex } from 'knex';
import { ActivityStreamOperations } from './ActivityStreamOperations';
import { AuditProgress, EventType } from './operations.types';

export class AuditOperations {
  private readonly activityStreamOps: ActivityStreamOperations;

  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
  ) {
    this.activityStreamOps = new ActivityStreamOperations(db, logger);
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
    const validProgressValues: AuditProgress[] = [
      'audit_started',
      'details_under_review',
      'final_sign_off_done',
      'summary_generated',
      'completed',
    ];
    if (
      updateData.progress &&
      !validProgressValues.includes(updateData.progress as AuditProgress)
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
    progress: AuditProgress,
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
    let eventType: EventType;
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

    await this.activityStreamOps.createActivityEvent({
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
}
