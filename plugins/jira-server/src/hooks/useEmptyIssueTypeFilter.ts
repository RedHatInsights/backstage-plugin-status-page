import { useLocalStorage } from 'react-use';
import { IssuesCounter } from '../types';

export type IssuetypeType = 'non-empty' | 'all';

export const useEmptyIssueTypeFilter = (
  issueTypes: IssuesCounter[] | undefined,
) => {
  const [type, setType] = useLocalStorage<IssuetypeType>(
    'jira-plugin-issuetype-filter',
    'non-empty',
  );

  return {
    issueTypes:
      type === 'non-empty'
        ? issueTypes?.filter(t => t.total !== 0)
        : issueTypes,
    type,
    changeType:
      type === 'non-empty' ? () => setType('all') : () => setType('non-empty'),
  };
};
