import { LoggerService } from '@backstage/backend-plugin-api';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import type { JiraIssue } from './types';

export class JiraClient {
  private readonly discovery: DiscoveryService;
  private readonly logger: LoggerService;

  constructor(options: {
    discovery: DiscoveryService;
    logger: LoggerService;
  }) {
    this.discovery = options.discovery;
    this.logger = options.logger;
  }

  async getIssue(issueKey: string): Promise<JiraIssue | null> {
    try {
      const baseUrl = await this.discovery.getBaseUrl('proxy');
      const url = `${baseUrl}/jira/rest/api/2/issue/${issueKey}`;

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
      });

      if (!response.ok) {
        this.logger.error(`JIRA API Response Status: ${response.status} - ${response.statusText}`);
        if (response.status === 404) {
          this.logger.warn(`JIRA issue ${issueKey} not found`);
          return null;
        }
        throw new Error(
          `Failed to fetch JIRA issue ${issueKey}. Status: ${response.status} - ${response.statusText}`,
        );
      }

      const issue: JiraIssue = await response.json();
      return issue;
    } catch (error) {
      this.logger.error(`Error fetching JIRA issue ${issueKey}:`, error as Error);
      throw error;
    }
  }
}
