import React, { useEffect, useState } from 'react';
import { Gauge } from '@mui/x-charts/Gauge';
import { jiraApiRef } from '../../../api';
import { useApi } from '@backstage/core-plugin-api';
import { Loader } from '../utils';
import { IEpicConfig } from '../constants';

interface IProps {
  epicConfig: IEpicConfig;
  totalSupportStoryPoint: number;
  onLoad: (
    loading: boolean,
    data: { supportWorkStoryPoints: number; newWorkStoryPoints: number },
  ) => void;
}

export const HighLevelGoals = (props: IProps) => {
  const [gaugeData, setGaugeData] = useState<any>();

  const jiraApi = useApi(jiraApiRef);
  const [fetchedEpicData, setFetchedData] = useState<any>();
  const [pageVars, setPageVars] = useState<any>({
    storyPointsPerEpic: {},
    totalStoryPoints: 0,
    loadingVisualData: false,
  });

  const countStoryPointsPerEpic = async () => {
    const storyPointsPerEpic: any = {};
    let totalStoryPoints = 0;

    fetchedEpicData.forEach((issue: any) => {
      const epic = issue.fields[props?.epicConfig.JiraCustomFields.epicNumber];
      totalStoryPoints +=
        issue.fields[props?.epicConfig.JiraCustomFields.storyPoints];
      if (storyPointsPerEpic[epic])
        storyPointsPerEpic[epic] +=
          issue.fields[props?.epicConfig.JiraCustomFields.storyPoints];
      else
        storyPointsPerEpic[epic] =
          issue.fields[props?.epicConfig.JiraCustomFields.storyPoints];
    });

    setPageVars({
      ...pageVars,
      storyPointsPerEpic: storyPointsPerEpic,
      totalStoryPoints: totalStoryPoints,
      loadingVisualData: false,
    });
    let totalSupportWork = props.totalSupportStoryPoint;

    props?.epicConfig.SUPPORT_JIRAS.forEach(
      (jira: string) =>
        (totalSupportWork += storyPointsPerEpic[jira]
          ? storyPointsPerEpic[jira]
          : 0),
    );

    let totalNewWork = 0;
    props?.epicConfig.NEW_WORK_JIRAS.forEach(
      (jira: string) =>
        (totalNewWork += storyPointsPerEpic[jira]
          ? storyPointsPerEpic[jira]
          : 0),
    );

    props.onLoad(false, {
      supportWorkStoryPoints: totalSupportWork,
      newWorkStoryPoints: totalNewWork,
    });
  };

  const fetchEpicData = async () => {
    setPageVars({
      ...pageVars,
      loadingVisualData: true,
    });
    props.onLoad(true, { supportWorkStoryPoints: 0, newWorkStoryPoints: 0 });

    jiraApi
      .getCombinedEpicData(props?.epicConfig.HLG_EPICS)
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
    if (props?.epicConfig) {
      setGaugeData(props.epicConfig.HLG_DETAILS);
      fetchEpicData();
    }
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
        minHeight: '17.7rem',
        padding: '0 1rem',
      }}
    >
      {pageVars.loadingVisualData ? (
        <Loader message="Fetching data from JIRA" />
      ) : (
        gaugeData &&
        gaugeData.map((data: any) => {
          return (
            <div style={{ display: 'flex', width: '33%', padding: '0.5rem' }}>
              <div>
                <Gauge
                  width={100}
                  height={100}
                  value={
                    pageVars.storyPointsPerEpic?.[data.epic] ||
                    props?.totalSupportStoryPoint
                  }
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
