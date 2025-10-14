import { Knex } from 'knex';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ManualDataItem } from '../../types/types';

export class ManualDataIntegration {
  private readonly db: Knex;
  private readonly logger: LoggerService;

  constructor(db: Knex, logger: LoggerService) {
    this.db = db;
    this.logger = logger;
  }

  async generateManualData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]> {
    const report: any[] = [];

    // Get manual entries from applications table
    const manualEntries = await this.db('applications')
      .select(
        'type',
        'environment',
        'app_delegate',
        'account_name',
        'app_name',
        'app_owner',
        'app_owner_email',
        'custom_reviewer',
      )
      .where({
        app_name: appname,
        source: 'manual',
      });

    if (!manualEntries.length) {
      this.logger.info(`No manual data found for appname: ${appname}`);
      return report;
    }

    this.logger.info(
      `Processing ${manualEntries.length} manual entries for appname: ${appname}`,
    );

    for (const app of manualEntries) {
      const {
        type,
        environment,
        app_delegate,
        account_name,
        app_name,
        app_owner,
        app_owner_email,
        custom_reviewer,
      } = app;

      if (type === 'rover-group-name') {
        // Add to group_access_reports table
        const dbRow = {
          environment,
          full_name: account_name,
          user_id: account_name,
          user_role: 'manual-entry',
          manager: app_owner || 'Manual Entry',
          manager_uid: app_owner_email?.split('@')[0] || '',
          sign_off_status: 'pending',
          sign_off_by: 'N/A',
          sign_off_date: null,
          source: 'manual',
          comments: '',
          ticket_reference: '',
          access_change_date: null,
          created_at: new Date(),
          account_name,
          app_name,
          frequency,
          period,
          app_delegate: custom_reviewer || app_delegate,
          ticket_status: null,
        };
        await this.db('group_access_reports').insert(dbRow);
        report.push(dbRow);
        this.logger.debug(`Added manual group access entry: ${account_name}`);
      } else if (type === 'service-account') {
        // Add to service_account_access_review table
        const dbRow = {
          app_name,
          environment,
          service_account: account_name,
          user_role: 'service-account',
          manager: app_owner || 'Manual Entry',
          manager_uid: app_owner_email?.split('@')[0] || '',
          sign_off_status: 'Pending',
          sign_off_by: 'N/A',
          sign_off_date: null,
          comments: '',
          ticket_reference: '',
          revoked_date: null,
          created_at: new Date(),
          updated_at: new Date(),
          period,
          frequency,
          app_delegate: custom_reviewer || app_delegate,
          ticket_status: '',
          source: 'manual',
        };
        await this.db('service_account_access_review').insert(dbRow);
        report.push(dbRow);
        this.logger.debug(
          `Added manual service account entry: ${account_name}`,
        );
      }
    }

    this.logger.info(
      `Successfully generated ${report.length} manual entries for appname: ${appname}`,
    );
    return report;
  }

  async fetchManualDataForFresh(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<any[]> {
    const report: any[] = [];

    const manualEntries = await this.db('applications')
      .select(
        'type',
        'environment',
        'app_delegate',
        'account_name',
        'app_name',
        'app_owner',
        'app_owner_email',
        'custom_reviewer',
      )
      .where({
        app_name: appname,
        source: 'manual',
      });

    if (!manualEntries.length) {
      return report;
    }

    for (const app of manualEntries) {
      const {
        type,
        environment,
        app_delegate,
        account_name,
        app_name,
        app_owner,
        custom_reviewer,
      } = app;

      if (type === 'rover-group-name') {
        const dbRow = {
          environment,
          full_name: account_name,
          user_id: account_name,
          user_role: 'manual-entry',
          manager: app_owner || 'Manual Entry',
          source: 'manual',
          account_name,
          app_name,
          period,
          frequency,
          app_delegate: custom_reviewer || app_delegate,
          created_at: new Date(),
        };
        report.push(dbRow);
      } else if (type === 'service-account') {
        const dbRow = {
          app_name,
          environment,
          service_account: account_name,
          user_role: 'service-account',
          manager: app_owner || 'Manual Entry',
          app_delegate: custom_reviewer || app_delegate,
          source: 'manual',
          account_name,
          period,
          frequency,
          created_at: new Date(),
        };
        report.push(dbRow);
      }
    }

    return report;
  }

  /**
   * Validates manual data items for consistency and completeness.
   * @param manualData - Array of manual data items to validate
   * @returns Validation result with success status and any errors
   */
  async validateManualData(manualData: ManualDataItem[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (let i = 0; i < manualData.length; i++) {
      const item = manualData[i];
      const rowNumber = i + 1;

      // Check required fields
      if (!item.app_name) {
        errors.push(`Row ${rowNumber}: Missing required field 'app_name'`);
      }
      if (!item.account_name) {
        errors.push(`Row ${rowNumber}: Missing required field 'account_name'`);
      }

      // Validate that either service_account or user_id/full_name is provided
      if (!item.service_account && (!item.user_id || !item.full_name)) {
        errors.push(
          `Row ${rowNumber}: Must provide either 'service_account' or both 'user_id' and 'full_name'`,
        );
      }

      // Validate email format for custom_reviewer
      if (item.custom_reviewer && !this.isValidEmail(item.custom_reviewer)) {
        errors.push(
          `Row ${rowNumber}: Invalid email format for 'custom_reviewer': ${item.custom_reviewer}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates if a string is a valid email address.
   * @param email - Email string to validate
   * @returns True if valid email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
