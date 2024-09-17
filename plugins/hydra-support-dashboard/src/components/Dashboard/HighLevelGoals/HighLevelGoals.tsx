import React, { useEffect, useState } from 'react';
import { Gauge } from '@mui/x-charts/Gauge';
import { jiraApiRef } from '../../../api';
import { useApi } from '@backstage/core-plugin-api';
import { HLG_EPICS, JiraCustomFields } from '../constants/AnalyticsDashboard';
import { Loader } from '../utils';

interface IProps {
  totalStoryPoint: number;
}

export const HighLevelGoals = (_props: IProps) => {
  const GaugeData = [
    {
      title: 'Support Model',
      desc: 'Captures maintenance, compliance, enhancements & other support work done for all Hydra Modules',
      epic: 'HYDRA-11575',
    },
    {
      title: 'Hydra Case Bot',
      desc: ' XE Support Bot that provides instant case, escalation, shift and other such information to GSS associates',
      epic: 'HYDRA-11773',
    },
    {
      title: 'Broker Migration',
      desc: 'Add common utility in Automation framework for date field validation',
      epic: 'HYDRA-11589',
    },
    {
      title: 'Notifications UI',
      desc: 'New and revamped notification UI that allows XE Support associates to customize what notifications they get and when',
      epic: 'HYDRA-11590',
    },
    {
      title: 'Notification Templates',
      desc: 'Completed transition of Notification email templates from One platform to Hydra with roadmap to scale the service in future',
      epic: 'HYDRA-11541',
    },
    {
      title: 'JAVA 17 Migration',
      desc: 'Migrating and updating all existing Hydra Modules to Java 17',
      epic: 'HYDRA-11015',
    },
  ];

  const jiraApi = useApi(jiraApiRef);
  const [fetchedEpicData, setFetchedData] = useState<any>();
  const [pageVars, setPageVars] = useState<any>({
    storyPointsPerEpic: {},
    totalStoryPoints: 0,
    loadingVisualData: false,
  });

  const countStoryPointsPerEpic = () => {
    const storyPointsPerEpic: any = {};
    let totalStoryPoints = 0;

    fetchedEpicData.forEach((issue: any) => {
      const epic = issue.fields[JiraCustomFields.epicNumber];
      totalStoryPoints += issue.fields[JiraCustomFields.storyPoints];
      if (storyPointsPerEpic[epic])
        storyPointsPerEpic[epic] += issue.fields[JiraCustomFields.storyPoints];
      else
        storyPointsPerEpic[epic] = issue.fields[JiraCustomFields.storyPoints];
    });

    setPageVars({
      ...pageVars,
      storyPointsPerEpic: storyPointsPerEpic,
      totalStoryPoints: totalStoryPoints,
      loadingVisualData: false,
    });
  };

  const fetchEpicData = async () => {
    setPageVars({
      ...pageVars,
      loadingVisualData: true,
    });

    jiraApi
      .getCombinedEpicData(HLG_EPICS)
      .then(_data => {
        if (_data && _data.issues) {
          setFetchedData(_data.issues);
        }
      })
      .catch(_err => {
        return null;
      });
  };

  useEffect(() => {
    fetchEpicData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fetchedEpicData) countStoryPointsPerEpic();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedEpicData]);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        minHeight: '14.5rem',
        padding: '0 1rem',
      }}
    >
      {pageVars.loadingVisualData ? (
        <Loader message="Fetching data from JIRA" />
      ) : (
        GaugeData.map(data => {
          return (
            <div style={{ display: 'flex', width: '33%', padding: '0.5rem' }}>
              <div>
                <Gauge
                  width={100}
                  height={100}
                  value={pageVars.storyPointsPerEpic[data.epic]}
                  startAngle={-90}
                  endAngle={90}
                  valueMax={pageVars.totalStoryPoints}
                  text={({ value }) => `${value} pts`}
                />
              </div>
              <div style={{ textAlign: 'left', padding: '1rem 0 0 0.5rem' }}>
                <div style={{ fontWeight: '500' }}>{data.title}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {data.desc}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
