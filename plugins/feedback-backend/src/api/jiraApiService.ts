import axios from 'axios';

export const createJiraTicket = async (
  host: string,
  authToken: string,
  projectKey: string,
  summary: string,
  description: string,
  tag: string,
): Promise<any> => {
  const resp = await axios.post(
    `${host}/rest/api/latest/issue`,
    {
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
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return resp.data;
};
