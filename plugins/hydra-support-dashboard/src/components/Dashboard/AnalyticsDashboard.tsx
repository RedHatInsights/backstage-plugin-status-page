import React, { useEffect, useState } from 'react';
import { Header, Page, Content, HeaderLabel } from '@backstage/core-components';
import { Card, Grid, useTheme } from '@material-ui/core';

import { useApi } from '@backstage/core-plugin-api';
import { cmdbApiRef, jiraApiRef } from '../../api';
import useStyles from './AnalyticsDashboard.styles';
import { SankeyChart } from './SankeyChart/SankryChart';
import { StoryPointsChart } from './CountIssueStory/StoryPointsChart';
import { SortableTable } from './IssuesTable/SortableTable';
import { HighLevelGoals } from './HighLevelGoals/HighLevelGoals';
import {
  IProgressData,
  ISankeyData,
  ITableData,
  SUPPORT_JIRAS,
} from './constants';
import {
  Loader,
  prepareSankeyData,
  prepareTableData,
  prepareProgressData,
  prepareStatsIssueCountData,
} from './utils';

interface IPageVars {
  selectedEpic: string;
  loadingVisualData: boolean;
  sankeyData: ISankeyData[];
  progressData: IProgressData[];
  tableData: ITableData[];
  statsIssueCountData: { totalJiras: number; totalStoryPoints: number };
}

export const AnalyticsDashboard = () => {
  const theme: any = useTheme();
  const classes = useStyles(theme);
  const jiraApi = useApi(jiraApiRef);
  const cmdbApi = useApi(cmdbApiRef);

  const [pageVars, setPageVars] = useState<IPageVars>({
    selectedEpic: SUPPORT_JIRAS[0],
    loadingVisualData: false,
    sankeyData: [],
    progressData: [],
    tableData: [],
    statsIssueCountData: { totalJiras: 0, totalStoryPoints: 0 },
  });

  const [fetchedEpicData, setFetchedData] = useState<any>();
  const [fetchedCMDBData, setFetchedCMDBData] = useState<any>();

  const fetchEpicData = async () => {
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
      .getCombinedEpicData(SUPPORT_JIRAS)
      .then(_data => {
        if (_data && _data.issues) setFetchedData(_data.issues);
      })
      .catch(_err => {
        return null;
      });
  };

  const prepareAnalyticsData = async () => {
    const sankeyData = await prepareSankeyData(
      fetchedEpicData,
      fetchedCMDBData,
    );
    const progressData = await prepareProgressData(fetchedEpicData);
    const statsIssueCountData = await prepareStatsIssueCountData(
      fetchedEpicData,
    );
    const issuesTableData = await prepareTableData(
      fetchedEpicData,
      fetchedCMDBData,
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
    fetchEpicData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fetchedEpicData) {
      prepareAnalyticsData();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedEpicData]);

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
                        />
                      )}
                  </div>
                </div>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={10}>
                  <div className={classes.contentTitle}>High Level Goals</div>
                  <div
                    className={classes.jiraContent}
                    style={{ height: 'auto' }}
                  >
                    <HighLevelGoals
                      totalStoryPoint={
                        pageVars.statsIssueCountData.totalStoryPoints
                      }
                    />
                  </div>
                </Grid>
                <Grid item xs={2}>
                  <div>
                    <div className={classes.contentTitle}>Stats</div>
                    <div className={classes.jiraContent}>
                      {!pageVars.loadingVisualData && (
                        <StoryPointsChart
                          data={pageVars.statsIssueCountData}
                          mode={theme.palette.mode}
                        />
                      )}
                    </div>
                  </div>
                </Grid>
              </Grid>
              <Grid>
                <div className={classes.contentTitle}>JIRA Details</div>
                <div className={classes.jiraContent}>
                  {!pageVars.loadingVisualData && (
                    <SortableTable tableData={pageVars.tableData} />
                  )}
                </div>
              </Grid>
            </>
          )}
        </Card>
      </Content>
    </Page>
  );
};
