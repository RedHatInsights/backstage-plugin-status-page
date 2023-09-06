import {
  ConfigApi,
  createApiRef,
  DiscoveryApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import {
  IssueCountResult,
  IssueCountSearchParams,
  IssuesCounter,
  IssueType,
  Project,
  Status,
  Ticket,
} from '../types';

export const jiraApiRef = createApiRef<JiraAPI>({
  id: 'plugins.appdev.jira',
});

const DEFAULT_PROXY_PATH = '/jira/api';
const DEFAULT_REST_API_VERSION = 'latest';
const DONE_STATUS_CATEGORY = 'Done';

type Options = {
  discoveryApi: DiscoveryApi;
  configApi: ConfigApi;
  identityApi: IdentityApi;
};

export class JiraAPI {
  private readonly discoveryApi: DiscoveryApi;
  private readonly proxyPath: string;
  private readonly apiVersion: string;
  private readonly confluenceActivityFilter: string | undefined;
  private readonly identityApi: IdentityApi;

  constructor(options: Options) {
    this.discoveryApi = options.discoveryApi;

    const proxyPath = options.configApi.getOptionalString('jira.proxyPath');
    this.proxyPath = proxyPath ?? DEFAULT_PROXY_PATH;

    const apiVersion = options.configApi.getOptionalNumber('jira.apiVersion');
    this.apiVersion = apiVersion
      ? apiVersion.toString()
      : DEFAULT_REST_API_VERSION;

    this.confluenceActivityFilter = options.configApi.getOptionalString(
      'jira.confluenceActivityFilter',
    );

    this.identityApi = options.identityApi;
  }

  private generateProjectUrl = (url: string) =>
    new URL(url).origin +
    new URL(url).pathname.replace(/\/rest\/api\/.*$/g, '');

  private async getUrls() {
    const proxyUrl = await this.discoveryApi.getBaseUrl('proxy');
    return {
      apiUrl: `${proxyUrl}${this.proxyPath}/rest/api/${this.apiVersion}/`,
      baseUrl: `${proxyUrl}${this.proxyPath}`,
    };
  }

  private convertToString = (arrayElement: Array<string>): string =>
    arrayElement
      .filter(Boolean)
      .map(i => `'${i}'`)
      .join(',');

  private async pagedIssueCountRequest(
    apiUrl: string,
    jql: string,
    startAt: number,
  ): Promise<IssueCountResult> {
    const data = {
      jql,
      maxResults: -1,
      fields: [
        'key',
        'issuetype',
        'summary',
        'status',
        'assignee',
        'priority',
        'created',
        'updated',
      ],
      startAt,
    };

    const { token } = await this.identityApi.getCredentials();
    const request = await fetch(`${apiUrl}search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!request.ok) {
      throw new Error(
        `failed to fetch data, status ${request.status}: ${request.statusText}`,
      );
    }
    const response: IssueCountSearchParams = await request.json();
    const lastElement = response.startAt + response.maxResults;
    return {
      issues: response.issues,
      next: response.total > lastElement ? lastElement : undefined,
    };
  }

  private async getIssueCountPaged({
    apiUrl,
    projectKey,
    component,
    label,
    statusesNames,
  }: {
    apiUrl: string;
    projectKey: string;
    component: string;
    label: string;
    statusesNames: Array<string>;
  }) {
    const statusesString = this.convertToString(statusesNames);

    const jql = `project = "${projectKey}"
        ${statusesString ? `AND status in (${statusesString})` : ''}
        ${component ? `AND component = "${component}"` : ''}
        ${label ? `AND labels in ("${label}")` : ''}
        AND statuscategory not in ("Done") 
      `;

    let startAt: number | undefined = 0;
    const issues: Ticket[] = [];

    while (startAt !== undefined) {
      const res: IssueCountResult = await this.pagedIssueCountRequest(
        apiUrl,
        jql,
        startAt,
      );
      startAt = res.next;
      issues.push(...res.issues);
    }
    return issues;
  }

  async getProjectDetails(
    projectKey: string,
    component: string,
    label: string,
    statusesNames: Array<string>,
  ) {
    const { apiUrl } = await this.getUrls();

    const { token } = await this.identityApi.getCredentials();
    const request = await fetch(`${apiUrl}project/${projectKey}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!request.ok) {
      throw new Error(
        `failed to fetch data, status ${request.status}: ${request.statusText}`,
      );
    }
    const project = (await request.json()) as Project;

    // If component not defined, execute the same code. Otherwise use paged request
    // to fetch also the issue-keys of all the tasks for that component.
    let issuesCounter: IssuesCounter[] = [];
    let tickets: Ticket[] = [];
    const issuesTypes = project.issueTypes.map(
      (status: IssueType): IssuesCounter => ({
        name: status.name,
        iconUrl: status.iconUrl,
        total: 0,
      }),
    );
    const foundIssues = await this.getIssueCountPaged({
      apiUrl,
      projectKey,
      component,
      label,
      statusesNames,
    });
    issuesCounter = foundIssues
      .reduce((prev, curr) => {
        const name = curr.fields.issuetype.name;
        const idx = issuesTypes.findIndex(i => i.name === name);
        if (idx !== -1) {
          issuesTypes[idx].total++;
        }
        return prev;
      }, issuesTypes)
      .filter(el => el.name !== 'Sub-task');

    tickets = foundIssues.map(index => {
      return {
        key: index.key,
        summary: index?.fields?.summary,
        assignee: {
          displayName: index?.fields?.assignee?.displayName,
          avatarUrl: index?.fields?.assignee?.avatarUrls['48x48'],
        },
        status: index?.fields?.status?.name,
        priority: index?.fields?.priority,
        created: index?.fields?.created,
        updated: index?.fields?.updated,
      };
    }) as any;
    return {
      project: {
        name: project.name,
        iconUrl: project.avatarUrls['48x48'],
        type: project.projectTypeKey,
        url: this.generateProjectUrl(project.self),
      },
      issues:
        issuesCounter && issuesCounter.length
          ? issuesCounter.map(status => ({
              ...status,
            }))
          : [],
      tickets,
    };
  }

  async getActivityStream(
    size: number,
    projectKey: string,
    componentName: string | undefined,
    tickets: Ticket[] | undefined,
    label: string | undefined,
    isBearerAuth: boolean,
  ) {
    const { baseUrl } = await this.getUrls();
    let filterUrl = `streams=key+IS+${projectKey}`;
    if (tickets && (componentName || label)) {
      filterUrl += `&streams=issue-key+IS+${tickets
        .map(ticket => ticket.key)
        .join('+')}`;
      filterUrl += this.confluenceActivityFilter
        ? `&${this.confluenceActivityFilter}=activity+IS+NOT+*`
        : '';
    }

    const { token } = await this.identityApi.getCredentials();
    const request = await fetch(
      isBearerAuth
        ? `${baseUrl}/activity?maxResults=${size}&${filterUrl}`
        : `${baseUrl}/activity?maxResults=${size}&${filterUrl}&os_authType=basic`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!request.ok) {
      throw new Error(
        `Failed to fetch data, status ${request.status}: ${request.statusText}`,
      );
    }
    const activityStream = await request.text();

    return activityStream;
  }

  async getStatuses(projectKey: string) {
    const { apiUrl } = await this.getUrls();

    const { token } = await this.identityApi.getCredentials();
    const request = await fetch(`${apiUrl}project/${projectKey}/statuses`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!request.ok) {
      throw new Error(
        `failed to fetch data, status ${request.status}: ${request.statusText}`,
      );
    }
    const statuses = (await request.json()) as Array<Status>;

    return [
      ...new Set(
        statuses
          .flatMap(status => status.statuses)
          .filter(
            status => status.statusCategory?.name !== DONE_STATUS_CATEGORY,
          )
          .map(it => it.name)
          .reduce((acc, val) => {
            acc.push(val);
            return acc;
          }, [] as string[]),
      ),
    ];
  }
}
