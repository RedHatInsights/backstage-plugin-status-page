import {
  LoggerService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { JsonObject } from '@backstage/types';
import { Knex } from 'knex';
import { AccessReviewOperations } from './operations/AccessReviewOperations';
import { ActivityStreamOperations } from './operations/ActivityStreamOperations';
import { ApplicationOperations } from './operations/ApplicationOperations';
import { ReviewData } from './AuditComplianceDatabase.types';
import { AuditOperations } from './operations/AuditOperations';
import { DeleteOperations } from './operations/DeleteOperations';
import { JiraOperations } from './operations/JiraOperations';
import {
  AccountType,
  AccountSource,
  AuditProgress,
  EventType,
} from './operations/operations.types';

const migrationsDir = resolvePackagePath(
  '@appdev/backstage-plugin-audit-compliance-backend',
  'migrations',
);

export class AuditComplianceDatabase {
  private readonly db: Knex;
  private readonly logger: LoggerService;
  private readonly config: Config;

  // Operation instances
  private readonly applicationOps: ApplicationOperations;
  private readonly auditOps: AuditOperations;
  private readonly accessReviewOps: AccessReviewOperations;
  private readonly jiraOps: JiraOperations;
  private readonly activityStreamOps: ActivityStreamOperations;
  private readonly deleteOps: DeleteOperations;

  private constructor(knex: Knex, logger: LoggerService, config: Config) {
    this.db = knex;
    this.logger = logger;
    this.config = config;

    // Initialize operation instances
    this.applicationOps = new ApplicationOperations(knex, logger, config);
    this.auditOps = new AuditOperations(knex, logger, config);
    this.accessReviewOps = new AccessReviewOperations(knex, logger, config);
    this.jiraOps = new JiraOperations(knex, logger, config);
    this.activityStreamOps = new ActivityStreamOperations(knex, logger, config);
    this.deleteOps = new DeleteOperations(knex, logger, config);
  }

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
  // Implementation: ApplicationOperations.ts
  async getAllApplications() {
    return this.applicationOps.getAllApplications();
  }

  // Implementation: ApplicationOperations.ts
  async insertApplication(appData: any) {
    return this.applicationOps.insertApplication(appData);
  }

  // Implementation: ApplicationOperations.ts
  async updateApplication(id: number, updateData: any) {
    return this.applicationOps.updateApplication(id, updateData);
  }
  // Implementation: ApplicationOperations.ts
  async getApplicationDetails(appName: string) {
    return this.applicationOps.getApplicationDetails(appName);
  }

  // Implementation: ApplicationOperations.ts
  async getDistinctAppOwners(appName: string): Promise<string[]> {
    return this.applicationOps.getDistinctAppOwners(appName);
  }
  // Implementation: ApplicationOperations.ts
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
    }>;
    jira_metadata?: Record<string, string | { value: string; schema?: any }>;
    performed_by?: string;
  }) {
    return this.applicationOps.createApplicationWithAccounts(appData);
  }

  // Implementation: ApplicationOperations.ts
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
    }>;
    jira_metadata?: Record<string, string | { value: string; schema?: any }>;
    performed_by?: string;
  }) {
    return this.applicationOps.updateApplicationWithAccounts(appData);
  }

  // Implementation: AuditOperations.ts
  async getAllAudits(params?: {
    app_name?: string;
    frequency?: string;
    period?: string;
  }) {
    return this.auditOps.getAllAudits(params);
  }

  // Implementation: AuditOperations.ts
  async insertAudit(auditData: any) {
    return this.auditOps.insertAudit(auditData);
  }

  // Implementation: AuditOperations.ts
  async updateAudit(
    app_name: string,
    frequency: string,
    period: string,
    updateData: any,
  ) {
    return this.auditOps.updateAudit(app_name, frequency, period, updateData);
  }

  // Implementation: AuditOperations.ts
  async getAuditMetadata(auditId: number) {
    return this.auditOps.getAuditMetadata(auditId);
  }

  // Implementation: AuditOperations.ts
  async updateAuditMetadata(
    auditId: number,
    metadata: {
      documentation_evidence: JsonObject;
      auditor_notes: JsonObject;
    },
  ) {
    return this.auditOps.updateAuditMetadata(auditId, metadata);
  }

  // Implementation: AuditOperations.ts
  async updateAuditProgress(
    app_name: string,
    frequency: string,
    period: string,
    progress: AuditProgress,
    performed_by: string = 'system',
  ) {
    return this.auditOps.updateAuditProgress(
      app_name,
      frequency,
      period,
      progress,
      performed_by,
    );
  }

  // Implementation: AuditOperations.ts
  async findAuditByAppNamePeriod(
    appName: string,
    frequency: string,
    period: string,
  ) {
    return this.auditOps.findAuditByAppNamePeriod(appName, frequency, period);
  }

  // Implementation: ActivityStreamOperations.ts
  async createActivityEvent(event: {
    event_type: EventType;
    app_name: string;
    frequency?: string;
    period?: string;
    user_id?: string;
    performed_by: string;
    metadata?: JsonObject;
  }): Promise<any> {
    return this.activityStreamOps.createActivityEvent(event);
  }
  // Implementation: ActivityStreamOperations.ts
  async getActivityStreamEvents(params: {
    app_name: string;
    frequency?: string;
    period?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    return this.activityStreamOps.getActivityStreamEvents(params);
  }

  // Implementation: AccessReviewOperations.ts
  async getAccessReviews(params: {
    app_name: string;
    frequency: string;
    period: string;
  }) {
    return this.accessReviewOps.getAccessReviews(params);
  }

  // Implementation: AccessReviewOperations.ts
  async getGroupAccessReviewData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<ReviewData> {
    return this.accessReviewOps.getGroupAccessReviewData(
      appname,
      frequency,
      period,
    );
  }

  // Implementation: AccessReviewOperations.ts
  async getServiceAccountReviewData(
    appname: string,
    frequency: string,
    period: string,
  ): Promise<ReviewData> {
    return this.accessReviewOps.getServiceAccountReviewData(
      appname,
      frequency,
      period,
    );
  }

  // Implementation: AccessReviewOperations.ts
  async updateAccessReview(data: any[]): Promise<any[]> {
    return this.accessReviewOps.updateAccessReview(data);
  }

  // Implementation: AccessReviewOperations.ts
  async getServiceAccountAccessReviews(queryParams: {
    app_name: string;
    frequency: string;
    period: string;
  }) {
    return this.accessReviewOps.getServiceAccountAccessReviews(queryParams);
  }

  // Implementation: JiraOperations.ts
  async getJiraProjectByAppName(appName: string): Promise<string | null> {
    return this.jiraOps.getJiraProjectByAppName(appName);
  }

  // Implementation: JiraOperations.ts
  async getAuditJiraKey(
    appName: string,
    frequency: string,
    period: string,
  ): Promise<string | null> {
    return this.jiraOps.getAuditJiraKey(appName, frequency, period);
  }

  // Implementation: JiraOperations.ts
  async createAuditJiraTicket(
    auditData: { app_name: string; frequency: string; period: string },
    description?: string,
  ) {
    return this.jiraOps.createAuditJiraTicket(auditData, description);
  }
  // Implementation: JiraOperations.ts
  async createServiceAccountJiraTicket(params: any) {
    return this.jiraOps.createServiceAccountJiraTicket(params);
  }

  // Implementation: JiraOperations.ts
  async createAqrJiraTicketAndUpdateStatus(params: any) {
    return this.jiraOps.createAqrJiraTicketAndUpdateStatus(params);
  }

  // Implementation: JiraOperations.ts
  async addJiraCommentAndUpdateDb(
    id: number,
    comments: string,
    ticket_reference: string,
    table:
      | 'group_access_reports'
      | 'service_account_access_review' = 'group_access_reports',
  ) {
    return this.jiraOps.addJiraCommentAndUpdateDb(
      id,
      comments,
      ticket_reference,
      table,
    );
  }

  // Implementation: JiraOperations.ts
  async addServiceAccountJiraCommentAndUpdateDb(
    id: number,
    comments: string,
    ticket_reference: string,
  ) {
    return this.jiraOps.addServiceAccountJiraCommentAndUpdateDb(
      id,
      comments,
      ticket_reference,
    );
  }

  // Implementation: DeleteOperations.ts
  async deleteAuditData(
    app_name: string,
    frequency: string,
    period: string,
  ): Promise<{ groupAccessDeleted: number; serviceAccountsDeleted: number }> {
    return this.deleteOps.deleteAuditData(app_name, frequency, period);
  }

  // Implementation: DeleteOperations.ts
  async deleteApplicationById(id: number): Promise<number> {
    return this.deleteOps.deleteApplicationById(id);
  }

  // Implementation: DeleteOperations.ts
  async deleteApplicationByName(appName: string): Promise<{
    applicationsDeleted: number;
    auditsDeleted: number;
    groupAccessDeleted: number;
    serviceAccountsDeleted: number;
    freshDataDeleted: number;
    activityEventsDeleted: number;
    metadataDeleted: number;
  }> {
    return this.deleteOps.deleteApplicationByName(appName);
  }

  // Implementation: DeleteOperations.ts
  async deleteAuditById(id: number): Promise<number> {
    return this.deleteOps.deleteAuditById(id);
  }

  // Implementation: DeleteOperations.ts
  async deleteServiceAccountAccessReviewById(id: number): Promise<number> {
    return this.deleteOps.deleteServiceAccountAccessReviewById(id);
  }

  // Implementation: DeleteOperations.ts
  async deleteGroupAccessReportById(id: number): Promise<number> {
    return this.deleteOps.deleteGroupAccessReportById(id);
  }

  // Implementation: DeleteOperations.ts
  async deleteFreshData(
    app_name: string,
    frequency: string,
    period: string,
  ): Promise<{
    groupAccessFreshDeleted: number;
    serviceAccountsFreshDeleted: number;
  }> {
    return this.deleteOps.deleteFreshData(app_name, frequency, period);
  }

  // Implementation: DeleteOperations.ts
  async deleteActivityStreamEventById(id: number): Promise<number> {
    return this.deleteOps.deleteActivityStreamEventById(id);
  }

  // Implementation: DeleteOperations.ts
  async deleteAuditMetadataById(id: number): Promise<number> {
    return this.deleteOps.deleteAuditMetadataById(id);
  }

  // Implementation: DeleteOperations.ts
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
    return this.deleteOps.deleteAllData();
  }

  public getLogger() {
    return this.logger;
  }
  public getConfig() {
    return this.config;
  }
}
