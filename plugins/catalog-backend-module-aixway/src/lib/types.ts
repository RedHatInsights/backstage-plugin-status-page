export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    issuetype: {
      id: string;
      name: string;
      description?: string;
      iconUrl?: string;
      subtask: boolean;
    };
    status: {
      id: string;
      name: string;
      description?: string;
      statusCategory: {
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
    assignee?: {
      accountId?: string;
      key?: string;
      name?: string;
      displayName: string;
      emailAddress?: string;
    };
    description?: string;
    priority?: {
      id: string;
      name: string;
      iconUrl?: string;
    };
    labels?: string[];
    components?: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
  };
}

