import { ICMDBResult, ISankeyData, ITableData } from '../constants';

const monthsInQuarter = {
  Q1: [1, 2, 3],
  Q2: [4, 5, 6],
  Q3: [7, 8, 9],
  Q4: [10, 11, 12],
};

const validJiraStatuses = ['Release Pending', 'Closed', 'In Progress'];

function getCriticalityTier(jiraComponent: string, cmdbData: ICMDBResult[]) {
  if (['hydracore'].includes(jiraComponent.toLocaleLowerCase())) return 'C1';

  const findData: ICMDBResult | undefined = cmdbData.find(
    (data: ICMDBResult) =>
      data.name.replace(' ', '').toLocaleLowerCase() ===
      jiraComponent.toLocaleLowerCase(),
  );
  if (findData) return findData.business_criticality;
  return 'C4';
}

function getCombinedStatus(status: string) {
  switch (status) {
    case 'Code Review':
    case 'ON_DEV':
      return 'In Progress';
    case 'ON_QA':
      return 'Release Pending';
    default:
      return status;
  }
}

function matchQuarter(date: string) {
  const updateData = new Date(date);
  return monthsInQuarter.Q3.includes(updateData.getMonth());
}

export const prepareSankeyData = async (
  epicData: any,
  cmdbData: ICMDBResult[],
  epicTitles: {[key: string]: string},
  jiraCustomFields: {[key: string]: string},
) => {
  try {
    if (!epicData) return [];

    const epicToCriticalityMapData: any = {};
    const criticalityToJiraStatus: any = {};
    const countJiraPerEpic: any = {};
    const countJiraPerCriticalityTier: any = {};
    const countJiraPerStatus: any = {};
    let totalJiras = 0;

    const sankeyData: ISankeyData[] = [];

    epicData
      .filter((issue: any) => {
        const jiraStatus = getCombinedStatus(issue.fields.status.name);
        if (
          validJiraStatuses.includes(jiraStatus) &&
          matchQuarter(issue.fields.updated)
        ) {
          totalJiras++;
          return true;
        }
        return false;
      })
      .forEach((issue: any) => {
        const jiraStatus = getCombinedStatus(issue.fields.status.name);
        const epic = issue.fields[jiraCustomFields.epicNumber];
        const jiraCriticalityTier =
          issue.fields.components?.[0] && issue.fields.components?.[0].name
            ? getCriticalityTier(issue.fields.components[0].name, cmdbData)
            : 'C4';

        // mapping JIRA status per cirticatiily tier of JIRA
        if (criticalityToJiraStatus[jiraCriticalityTier]) {
          if (criticalityToJiraStatus[jiraCriticalityTier][jiraStatus])
            criticalityToJiraStatus[jiraCriticalityTier][jiraStatus] += 1;
          else criticalityToJiraStatus[jiraCriticalityTier][jiraStatus] = 1;
        } else {
          criticalityToJiraStatus[jiraCriticalityTier] = { [jiraStatus]: 1 };
        }

        // counting the number of JIRA per EPIC
        if (countJiraPerEpic[epic]) countJiraPerEpic[epic] += 1;
        else countJiraPerEpic[epic] = 1;

        // counting the number of JIRA per STATUS
        if (countJiraPerStatus[jiraStatus]) countJiraPerStatus[jiraStatus] += 1;
        else countJiraPerStatus[jiraStatus] = 1;

        // count JIRA Per criticality tier
        if (countJiraPerCriticalityTier[jiraCriticalityTier])
          countJiraPerCriticalityTier[jiraCriticalityTier] += 1;
        else countJiraPerCriticalityTier[jiraCriticalityTier] = 1;

        // mapping cirticatiily tier of JIRA per EPIC
        if (epicToCriticalityMapData[epic]) {
          if (epicToCriticalityMapData[epic][jiraCriticalityTier])
            epicToCriticalityMapData[epic][jiraCriticalityTier] += 1;
          else epicToCriticalityMapData[epic][jiraCriticalityTier] = 1;
        } else {
          epicToCriticalityMapData[epic] = { [jiraCriticalityTier]: 1 };
        }
      });

    if (epicToCriticalityMapData)
      Object.keys(epicToCriticalityMapData).forEach(epic => {
        if (Object.keys(epicToCriticalityMapData[epic]).length) {
          Object.keys(epicToCriticalityMapData[epic]).forEach(tier => {
            sankeyData.push({
              from: `${epicTitles[epic]} (${Math.round(
                (countJiraPerEpic[epic] / totalJiras) * 100,
              )}% | ${countJiraPerEpic[epic]} JIRAs)`,
              to: `${tier} (${Math.round(
                (countJiraPerCriticalityTier[tier] / totalJiras) * 100,
              )}% | ${countJiraPerCriticalityTier[tier]} JIRAs)`,
              flow: epicToCriticalityMapData[epic][tier],
            });
          });
        }
      });

    if (criticalityToJiraStatus)
      Object.keys(criticalityToJiraStatus).forEach(tier => {
        if (Object.keys(criticalityToJiraStatus[tier]).length) {
          Object.keys(criticalityToJiraStatus[tier]).forEach(status => {
            sankeyData.push({
              from: `${tier} (${Math.round(
                (countJiraPerCriticalityTier[tier] / totalJiras) * 100,
              )}% | ${countJiraPerCriticalityTier[tier]} JIRAs)`,
              to: `${status} (${Math.round(
                (countJiraPerStatus[status] / totalJiras) * 100,
              )}% | ${countJiraPerStatus[status]} JIRAs)`,
              flow: criticalityToJiraStatus[tier][status],
            });
          });
        }
      });

    return sankeyData;
  } catch (err) {
    return [];
  }
};

export const prepareProgressData = (epicData: any) => {
  try {
    const epicProgressMapData: any = {};
    epicData.forEach((issue: any) => {
      const jiraStatus = issue.fields.status.name;
      if (epicProgressMapData[jiraStatus]) {
        epicProgressMapData[jiraStatus] += 1;
      } else epicProgressMapData[jiraStatus] = 1;
    });

    return epicProgressMapData;
  } catch (err) {
    return [];
  }
};

export const prepareStatsIssueCountData = (
  epicData: any,
  jiraCustomFields: {[key: string]: string},
) => {
  let totalStoryPoints = 0;
  let totalJiras = 0;
  try {
    epicData
      .filter((issue: any) => {
        const jiraStatus = getCombinedStatus(
          issue.fields.status?.name || 'none',
        );
        if (
          validJiraStatuses.includes(jiraStatus) &&
          matchQuarter(issue.fields.updated)
        )
          totalJiras++;
        return issue;
      })
      .forEach((issue: any) => {
        totalStoryPoints += issue.fields[jiraCustomFields.storyPoints];
      });

    return { totalJiras, totalStoryPoints };
  } catch (err) {
    return { totalJiras, totalStoryPoints };
  }
};

export const prepareTableData = (
  epicData: any,
  cmdbData: ICMDBResult[],
  epicTitles: {[key: string]: string},
  jiraCustomFields: {[key: string]: string},
) => {
  try {
    const issuesTableData: ITableData[] = [];
    epicData
      .filter((issue: any) => {
        const jiraStatus = getCombinedStatus(issue.fields.status.name);
        if (
          validJiraStatuses.includes(jiraStatus) &&
          matchQuarter(issue.fields.updated)
        )
          return true;
        return false;
      })
      .forEach((issue: any, index: number) => {
        issuesTableData.push({
          id: index + 1,
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields?.status.name,
          criticality:
            issue.fields?.components?.[0] && issue.fields?.components?.[0].name
              ? getCriticalityTier(issue.fields?.components?.[0].name, cmdbData)
              : 'C4',
          epic: epicTitles[issue.fields[jiraCustomFields.epicNumber]],
        });
      });

    return issuesTableData;
  } catch (err) {
    return [];
  }
};
