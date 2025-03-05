import React, { useEffect, useState } from 'react';
import { Header, Page, Content, HeaderLabel } from '@backstage/core-components';
import { Card, Grid, useTheme } from '@material-ui/core';

import { useApi } from '@backstage/core-plugin-api';
import { cmdbApiRef, jiraApiRef } from '../../api';
import useStyles from './AnalyticsDashboard.styles';
import { SankeyChart } from './SankeyChart/SankryChart';
import { SortableTable } from './IssuesTable/SortableTable';
import { HighLevelGoals } from './HighLevelGoals/HighLevelGoals';
import {
  IEpicConfig,
  IProgressData,
  ISankeyData,
  ITableData,
} from './constants';
import {
  Loader,
  prepareSankeyData,
  prepareTableData,
  prepareProgressData,
  prepareStatsIssueCountData,
} from './utils';
import { NewAndSupportWorkChart } from './NewWorkAndSupportWork/NewAndSupportWork';

interface IPageVars {
  loadingVisualData: boolean;
  sankeyData: ISankeyData[];
  progressData: IProgressData[];
  tableData: ITableData[];
  statsIssueCountData: { totalJiras: number; totalStoryPoints: number };
  loadingWorkData: boolean;
  workData: { supportWorkStoryPoints: number; newWorkStoryPoints: number };
}

export const AnalyticsDashboard = () => {
  const theme: any = useTheme();
  const classes = useStyles(theme);
  const jiraApi = useApi(jiraApiRef);
  const cmdbApi = useApi(cmdbApiRef);

  const [pageVars, setPageVars] = useState<IPageVars>({
    loadingVisualData: false,
    sankeyData: [],
    progressData: [],
    tableData: [],
    statsIssueCountData: { totalJiras: 0, totalStoryPoints: 0 },
    loadingWorkData: false,
    workData: { supportWorkStoryPoints: 0, newWorkStoryPoints: 0 },
  });

  const [fetchedEpicData, setFetchedData] = useState<any>();
  const [fetchedCMDBData, setFetchedCMDBData] = useState<any>();
  const [epicConfig, setEpicConfig] = useState<IEpicConfig>();

  const fetchConfigData = async () => {
    setPageVars({
      ...pageVars,
      loadingVisualData: true,
    });

    cmdbApi
      .getCMDBData()
      .then(_data => {
        if (_data && _data.result) setFetchedCMDBData(_data.result);
      })
      .catch(_err => {
        return null;
      });

    jiraApi
      .getConfig()
      .then(configData => {
        if (configData) {
          setEpicConfig(configData);
        }
      })
      .catch(_err => {
        return null;
      });
  };

  const fetchEpicData = async () => {
    if (epicConfig)
      jiraApi
        .getCombinedEpicData(Object.keys(epicConfig.Epics))
        .then(_data => {
          if (_data && _data.issues) setFetchedData(_data.issues);
        })
        .catch(_err => {
          return null;
        });
  };

  const prepareAnalyticsData = async () => {
    if (!epicConfig) return;
    const sankeyData = await prepareSankeyData(
      fetchedEpicData,
      fetchedCMDBData,
      epicConfig.Epics,
      epicConfig.JiraCustomFields,
    );
    const progressData = await prepareProgressData(fetchedEpicData);
    const statsIssueCountData = await prepareStatsIssueCountData(
      fetchedEpicData,
      epicConfig.JiraCustomFields,
    );
    const issuesTableData = await prepareTableData(
      fetchedEpicData,
      fetchedCMDBData,
      epicConfig.Epics,
      epicConfig.JiraCustomFields,
    );

    setPageVars({
      ...pageVars,
      sankeyData: sankeyData,
      progressData: progressData,
      tableData: issuesTableData,
      statsIssueCountData: statsIssueCountData,
      loadingVisualData: false,
    });
  };

  useEffect(() => {
    fetchConfigData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fetchedEpicData) prepareAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedEpicData]);

  useEffect(() => {
    if (epicConfig) fetchEpicData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicConfig]);

  return (
    <Page themeId="tool">
      <Header
        title="Hydra Support Analytics Dashboard"
        subtitle="Analytics based on JIRA tickets"
      >
        <HeaderLabel label="Owner" value="Team Hydra" />
      </Header>
      <Content>
        <Card className={classes.content}>
          {pageVars.loadingVisualData ? (
            <Loader message="Fetching data from JIRA " />
          ) : (
            <>
              <Grid>
                <div
                  className={classes.contentTitle}
                  style={{ textAlign: 'left' }}
                >
                  Q3' 2024 Support Metrics
                </div>
                <div className={classes.jiraContent}>
                  <div
                    style={{
                      margin: 'auto',
                      display: 'flex',
                      padding: '1rem 1rem',
                    }}
                  >
                    {!pageVars.loadingVisualData &&
                      pageVars.sankeyData.length && (
                        <SankeyChart
                          visualData={pageVars.sankeyData}
                          mode={theme.palette.mode}
                          totalJiras={pageVars.statsIssueCountData.totalJiras}
                        />
                      )}
                  </div>
                </div>
              </Grid>
              <Grid>
                <div className={classes.contentTitle}>JIRA Details</div>
                <div className={classes.jiraContent}>
                  {!pageVars.loadingVisualData && epicConfig && (
                    <SortableTable
                      epicConfig={epicConfig}
                      tableData={pageVars.tableData}
                    />
                  )}
                </div>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={9}>
                  <div className={classes.contentTitle}>High Level Goals</div>
                  <div
                    className={classes.jiraContent}
                    style={{ height: 'auto' }}
                  >
                    {epicConfig && (
                      <HighLevelGoals
                        epicConfig={epicConfig}
                        totalSupportStoryPoint={
                          pageVars.statsIssueCountData.totalStoryPoints
                        }
                        onLoad={(load, data) =>
                          setPageVars({
                            ...pageVars,
                            loadingWorkData: load,
                            workData: data,
                          })
                        }
                      />
                    )}
                  </div>
                </Grid>
                <Grid item xs={3}>
                  <div>
                    <div className={classes.contentTitle}>Stats</div>
                    <div className={classes.jiraContent}>
                      {!pageVars.loadingVisualData && (
                        <NewAndSupportWorkChart
                          data={pageVars.workData}
                          mode={theme.palette.mode}
                          loading={pageVars.loadingWorkData}
                        />
                      )}
                    </div>
                  </div>
                </Grid>
              </Grid>
            </>
          )}
        </Card>
      </Content>
    </Page>
  );
};
