import axios from 'axios';

export const createJiraTicket = async (
  host: string,
  authToken: string,
  projectKey: string,
  summary: string,
  description: string,
  tag: string,
  reporter?: string,
): Promise<any> => {
  let body: any = {
    fields: {
      project: {
        key: projectKey,
      },
      summary: summary,
      description: description,
      labels: [
        'reported-by-backstage',
        tag!.toLowerCase().split(' ').join('-'),
      ],
      issuetype: {
        name: 'Task',
      },
    },
  };
  if (reporter) {
    body = {
      fields: {
        reporter: {
          name: reporter,
        },
        project: {
          key: projectKey,
        },
        summary: summary,
        description: description,
        labels: [
          'reported-by-backstage',
          tag!.toLowerCase().split(' ').join('-'),
        ],
        issuetype: {
          name: 'Task',
        },
      },
    };
  }
  const resp = await axios.post(`${host}/rest/api/latest/issue`, body, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  return resp.data;
};

export const getJiraUsernameByEmail = async (
  host: string,
  reporterEmail: string,
  authToken: string,
): Promise<string | undefined> => {
  const resp = await axios.get(
    `${host}/rest/api/latest/user/search?username=${reporterEmail}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const data = resp.data;
  if (data.length === 0) return undefined;
  else {
    return data[0].name;
  }
};
