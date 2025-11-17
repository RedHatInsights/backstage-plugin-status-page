import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import {
  Template,
  TemplateListItem,
  ScaffolderTask,
  ScaffolderTaskDetails,
  TaskEventLog,
  ScaffolderAction,
} from '../types/scaffolder';
import { SCAFFOLDER_API_ENDPOINTS } from '../utils/constants';
import { buildScaffolderUrl, buildHeaders } from '../utils/helpers';

/**
 * Client for interacting with Backstage Scaffolder API
 * API Docs: https://backstage.io/docs/features/software-templates/
 */
export class ScaffolderClient {
  constructor(
    private readonly auth: AuthService,
    private readonly discovery: DiscoveryService,
  ) {}

  /**
   * List all available templates
   */
  async listTemplates(filters?: {
    kind?: string[];
    type?: string[];
    tags?: string[];
  }): Promise<TemplateListItem[]> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const url = buildScaffolderUrl(baseUrl, SCAFFOLDER_API_ENDPOINTS.LIST_TEMPLATES);

    const response = await this.fetch(url);
    const data = await response.json();

    let templates: TemplateListItem[] = data.items || data || [];

    // Apply filters if provided
    if (filters) {
      templates = templates.filter(template => {
        if (
          filters.kind &&
          filters.kind.length > 0 &&
          !filters.kind.includes(template.kind)
        ) {
          return false;
        }
        if (
          filters.type &&
          filters.type.length > 0 &&
          !filters.type.includes(template.spec.type)
        ) {
          return false;
        }
        if (
          filters.tags &&
          filters.tags.length > 0 &&
          !filters.tags.some(tag => template.metadata.tags?.includes(tag))
        ) {
          return false;
        }
        return true;
      });
    }

    return templates;
  }

  /**
   * Get template details by reference
   */
  async getTemplate(templateRef: string): Promise<Template> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const encodedRef = encodeURIComponent(templateRef);
    const url = buildScaffolderUrl(
      baseUrl,
      `${SCAFFOLDER_API_ENDPOINTS.GET_TEMPLATE}/${encodedRef}`,
    );

    const response = await this.fetch(url);
    return await response.json();
  }

  /**
   * Trigger a template to create new project
   */
  async triggerTemplate(
    templateRef: string,
    values: Record<string, any>,
  ): Promise<ScaffolderTask> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const url = buildScaffolderUrl(baseUrl, SCAFFOLDER_API_ENDPOINTS.TRIGGER_TEMPLATE);

    const response = await this.fetch(url, {
      method: 'POST',
      headers: buildHeaders(await this.getToken()),
      body: JSON.stringify({
        templateRef,
        values,
      }),
    });

    return await response.json();
  }

  /**
   * Get task status and details
   */
  async getTaskStatus(taskId: string): Promise<ScaffolderTaskDetails> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const url = buildScaffolderUrl(
      baseUrl,
      `${SCAFFOLDER_API_ENDPOINTS.GET_TASK}/${taskId}`,
    );

    const response = await this.fetch(url);
    return await response.json();
  }

  /**
   * Get task event logs
   */
  async getTaskLogs(
    taskId: string,
    after?: number,
  ): Promise<TaskEventLog[]> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    let url = buildScaffolderUrl(
      baseUrl,
      `${SCAFFOLDER_API_ENDPOINTS.GET_TASK_LOGS}/${taskId}/eventstream`,
    );

    if (after !== undefined) {
      url += `?after=${after}`;
    }

    const response = await this.fetch(url);
    const text = await response.text();

    // Parse SSE format logs
    const logs: TaskEventLog[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          logs.push(data);
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return logs;
  }

  /**
   * List all installed scaffolder actions
   * API Docs: https://backstage.io/docs/features/software-templates/api/list-actions
   */
  async listActions(): Promise<ScaffolderAction[]> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const url = buildScaffolderUrl(baseUrl, SCAFFOLDER_API_ENDPOINTS.LIST_ACTIONS);

    const response = await this.fetch(url);
    const data = await response.json();

    // The response is an array of actions
    return Array.isArray(data) ? data : data.items || [];
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<void> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const url = buildScaffolderUrl(
      baseUrl,
      `${SCAFFOLDER_API_ENDPOINTS.CANCEL_TASK}/${taskId}/cancel`,
    );

    await this.fetch(url, {
      method: 'POST',
    });
  }

  /**
   * List tasks
   */
  async listTasks(): Promise<ScaffolderTask[]> {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const url = buildScaffolderUrl(baseUrl, SCAFFOLDER_API_ENDPOINTS.LIST_TASKS);

    const response = await this.fetch(url);
    const data = await response.json();

    return Array.isArray(data) ? data : data.items || [];
  }

  /**
   * Private fetch method with authentication
   */
  private async fetch(url: string, options?: RequestInit): Promise<Response> {
    const token = await this.getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Scaffolder API request failed: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response;
  }

  /**
   * Get plugin request token
   */
  private async getToken(): Promise<string> {
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'scaffolder',
    });
    return token;
  }
}

