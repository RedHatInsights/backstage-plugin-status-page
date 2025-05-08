import { InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { dataLayerApiRef } from '../../../api';
import {
  BarChart,
  LineChart,
  lineElementClasses,
  markElementClasses,
} from '@mui/x-charts';
import {
  ChartTimePeriods,
  RedHatStandardColors,
  getLocaleNumberString,
} from '../constants';

export enum AttachmentsApiEndpoints {
  UniqueUsers = 'attachments/unique-users',
  AttachmentDownloads = 'attachments/downloads',
  AttachmentsUploads = 'attachments/uploads',
}
export const AttachmentsAnalytics = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [seriesForAttachmentsDownloads, setSeriesForAttachmentsDownloads] =
    useState<number[]>([]);
  const [xLabelsForAttachmentsDownloads, setXLabelsForAttachmentsDownloads] =
    useState<string[]>([]);

  const [seriesForAttachmentsUploads, setSeriesForAttachmentsUploads] =
    useState<number[]>([]);
  const [xLabelsForAttachmentsUploads, setXLabelsForAttachmentsUploads] =
    useState<string[]>([]);

  const [seriesForUniqueUsers, setSeriesForUniqueUsers] = useState<number[]>(
    [],
  );
  const [xLabelsForUniqueUsers, setXLabelsForUniqueUsers] = useState<string[]>(
    [],
  );
  const [lastUpdatedOn, setLastUpdatedOn] = useState<string>('');
  const isButtonDisabled = true;

  const dataLayerApi = useApi(dataLayerApiRef);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    ChartTimePeriods[0].id,
  );
  const [uniqueUsers, setUniqueUsers] = useState<[]>([]);
  const [attachmentDownloads, setAttachmentDownloads] = useState<[]>([]);
  const [attachmentUploads, setAttachmentUploads] = useState<[]>([]);

  const fetchAttachmentStats = async () => {
    try {
      setLoadingData(true);
      const uniqueUsersResponse = await dataLayerApi.getHydraSplunkStats(
        AttachmentsApiEndpoints.UniqueUsers,
      );
      const attachmentDownloadsResponse =
        await dataLayerApi.getHydraSplunkStats(
          AttachmentsApiEndpoints.AttachmentDownloads,
        );
      const attachmentsUploadsResponse = await dataLayerApi.getHydraSplunkStats(
        AttachmentsApiEndpoints.AttachmentsUploads,
      );
      if (uniqueUsersResponse?.data && uniqueUsersResponse.data?.searchData) {
        setUniqueUsers(JSON.parse(uniqueUsersResponse.data?.searchData).data);
      }

      if (
        attachmentDownloadsResponse?.data &&
        attachmentDownloadsResponse.data?.searchData
      ) {
        setAttachmentDownloads(
          JSON.parse(attachmentDownloadsResponse.data?.searchData).data,
        );
        setLastUpdatedOn(
          new Date(
            attachmentDownloadsResponse?.data?.lastUpdatedOn,
          ).toDateString(),
        );
      }

      if (
        attachmentsUploadsResponse?.data &&
        attachmentsUploadsResponse.data?.searchData
      ) {
        setAttachmentUploads(
          JSON.parse(attachmentsUploadsResponse.data?.searchData).data,
        );
      }
      setLoadingData(false);
    } catch (err) {
      setUniqueUsers([]);
      setAttachmentDownloads([]);
      setAttachmentUploads([]);
      setLoadingData(false);
    }
  };

  const getTimedStats = (statistics: any[]) => {
    let timedStats: { [key: string]: string }[] = [];
    if (selectedTimePeriod && selectedTimePeriod !== '6') {
      timedStats = [...statistics].splice(
        statistics.length - parseInt(selectedTimePeriod, 10),
      );
    } else timedStats = statistics;

    return timedStats;
  };

  const getNumberStatsForUniqueUsers = () => {
    const timedStats = getTimedStats(uniqueUsers);
    let totalUserCount: number = 0;
    let totalUsersExcludingWeekends: number = 0;
    let workingDays: number = 0;

    timedStats?.forEach((stats: { [key: string]: string }) => {
      const count = parseInt(stats['distinct_count(authenticatedUser)'], 10);
      totalUserCount += count;
      if (![6, 0].includes(new Date(stats._time).getDay())) {
        totalUsersExcludingWeekends += count;
        workingDays++;
      }
    });

    const dailyAverageUniqueUsers = Math.ceil(
      totalUsersExcludingWeekends / workingDays,
    );

    const totalUserActivitiesStringValue =
      getLocaleNumberString(totalUserCount);
    const dailyAverageUniqueUsersStringValue = getLocaleNumberString(
      dailyAverageUniqueUsers,
    );

    return {
      totalUserActivitiesStringValue,
      dailyAverageUniqueUsersStringValue,
    };
  };

  const getNumberStats = (statistics: any[]) => {
    const timedStats = getTimedStats(statistics);
    let maximumRequestInADay = 0;
    let totalRequests = 0;

    timedStats.forEach(stat => {
      const count = parseInt(stat.count, 10);
      totalRequests += count;
      if (count > maximumRequestInADay) maximumRequestInADay = count;
    });

    const totalRequestsStringValue = getLocaleNumberString(totalRequests);
    const maximumRequestsInADayStringValue =
      getLocaleNumberString(maximumRequestInADay);
    const averageRequestPerDay = Math.ceil(
      totalRequests / parseInt(selectedTimePeriod, 10),
    );
    const averageRequestsPerDayStringValue =
      getLocaleNumberString(averageRequestPerDay);

    return {
      totalRequestsStringValue,
      averageRequestsPerDayStringValue,
      maximumRequestsInADayStringValue,
    };
  };

  const formatLineChartDataForUniqueUsers = () => {
    try {
      const timedStats = getTimedStats(uniqueUsers);
      const requestDates: string[] = [];
      const chartSeries: number[] = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(new Date(stats._time).toDateString());

        chartSeries.push(
          parseInt(stats['distinct_count(authenticatedUser)'], 10),
        );
      });

      setSeriesForUniqueUsers(chartSeries);
      setXLabelsForUniqueUsers(requestDates);
    } catch (_err) {
      setSeriesForUniqueUsers([]);
      setXLabelsForUniqueUsers([]);
    }
  };

  const formatLineChartDataForAttachmentsDownloads = () => {
    try {
      const timedStats = getTimedStats(attachmentDownloads);
      const requestDates: string[] = [];
      const chartSeries: number[] = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(new Date(stats._time).toDateString());

        chartSeries.push(parseInt(stats.count, 10));
      });

      setSeriesForAttachmentsDownloads(chartSeries);
      setXLabelsForAttachmentsDownloads(requestDates);
    } catch (_err) {
      setSeriesForAttachmentsDownloads([]);
      setXLabelsForAttachmentsDownloads([]);
    }
  };

  const formatLineChartDataForAttachmentsUploads = () => {
    try {
      const timedStats = getTimedStats(attachmentUploads);
      const requestDates: string[] = [];
      const chartSeries: number[] = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(new Date(stats._time).toDateString());

        chartSeries.push(parseInt(stats.count, 10));
      });

      setSeriesForAttachmentsUploads(chartSeries);
      setXLabelsForAttachmentsUploads(requestDates);
    } catch (_err) {
      setSeriesForAttachmentsUploads([]);
      setXLabelsForAttachmentsUploads([]);
    }
  };

  const getFilters = () => {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <FormControl variant="outlined" size="small">
          <InputLabel id="Period">Period</InputLabel>
          <Select
            labelId="Period"
            label="Period"
            value={selectedTimePeriod}
            onChange={evt => {
              setSelectedTimePeriod(`${evt.target.value}`);
            }}
          >
            {ChartTimePeriods.map(period => (
              <MenuItem value={period.id}>{period.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  };

  useEffect(() => {
    fetchAttachmentStats();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (attachmentDownloads.length)
      formatLineChartDataForAttachmentsDownloads();
    if (attachmentUploads.length) formatLineChartDataForAttachmentsUploads();
    if (uniqueUsers.length) formatLineChartDataForUniqueUsers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentDownloads, attachmentUploads, uniqueUsers, selectedTimePeriod]);

  return (
    <div
      style={{
        border: '1px ridge',
        padding: '1rem',
        borderRadius: '0.3rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          paddingBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Typography variant="h3" style={{ display: 'flex', gap: '1rem' }}>
            <div>Attachments Analytics</div>
            <div>
              <Button size="small" disabled={isButtonDisabled}>
                {`Last updated on: ${lastUpdatedOn}`}
              </Button>
            </div>
          </Typography>
        </div>
        <div>{getFilters()}</div>
      </div>
      {loadingData ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <InfoCard>
              <div style={{ minHeight: '15rem' }}>
                <Typography
                  variant="h6"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Attachments Daily Unique Users</div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <BarChart
                  height={200}
                  series={[
                    {
                      data: seriesForUniqueUsers,
                      label: 'Unique Users',
                      type: 'bar',
                    },
                  ]}
                  xAxis={[{ scaleType: 'band', data: xLabelsForUniqueUsers }]}
                  yAxis={[
                    { id: 'leftAxisId' },
                    { id: 'rightAxisId', position: 'right' },
                  ]}
                />
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={3}>
            <InfoCard>
              <div style={{ minHeight: '15rem' }}>
                <Typography variant="h6">
                  <div>Total Unique User Activities</div>
                </Typography>
                <Typography variant="h6" style={{ fontSize: '2rem' }}>
                  {
                    getNumberStatsForUniqueUsers()
                      .totalUserActivitiesStringValue
                  }
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <Typography variant="h6">
                  <div>Daily Average Unique Users</div>
                </Typography>
                <Typography variant="h6" style={{ fontSize: '2rem' }}>
                  {
                    getNumberStatsForUniqueUsers()
                      .dailyAverageUniqueUsersStringValue
                  }
                </Typography>
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={9}>
            <InfoCard>
              <div style={{ maxHeight: '20rem' }}>
                <Typography
                  variant="h6"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Attachments Daily Downloads (Via Hydra)</div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <LineChart
                  height={300}
                  margin={{ left: 100, bottom: 50 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'bottom', horizontal: 'middle' },
                    },
                  }}
                  series={[{ data: seriesForAttachmentsDownloads }]}
                  xAxis={[
                    {
                      scaleType: 'point',
                      data: xLabelsForAttachmentsDownloads,
                    },
                  ]}
                  sx={{
                    [`.${lineElementClasses.root}, .${markElementClasses.root}`]:
                      {
                        strokeWidth: 1,
                      },
                    '.MuiLineElement-series-pvId': {
                      strokeDasharray: '5 5',
                    },
                    '.MuiLineElement-series-uvId': {
                      strokeDasharray: '3 4 5 2',
                    },
                    [`.${markElementClasses.root}:not(.${markElementClasses.highlighted})`]:
                      {
                        fill: '#fff',
                      },
                    [`& .${markElementClasses.highlighted}`]: {
                      stroke: 'none',
                    },
                  }}
                  colors={RedHatStandardColors}
                />
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={3}>
            <InfoCard>
              <div style={{ minHeight: '20rem' }}>
                <Typography variant="h6">Total Downloads</Typography>
                <>
                  <Typography variant="h6" style={{ fontSize: '2rem' }}>
                    {getNumberStats(attachmentDownloads)
                      .totalRequestsStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average Downloads Per Day
                  </Typography>
                  <Typography variant="h6" style={{ fontSize: '2rem' }}>
                    {getNumberStats(attachmentDownloads)
                      .averageRequestsPerDayStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Maximum Downloads In A Day
                  </Typography>
                  <Typography variant="h6" style={{ fontSize: '2rem' }}>
                    {getNumberStats(attachmentDownloads)
                      .maximumRequestsInADayStringValue || 'N/A'}
                  </Typography>
                </>
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={9}>
            <InfoCard>
              <div style={{ maxHeight: '20rem' }}>
                <Typography
                  variant="h6"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Attachments Daily Uploads (Via Hydra)</div>
                  <div>{}</div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <LineChart
                  height={300}
                  margin={{ left: 100, bottom: 50 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'bottom', horizontal: 'middle' },
                    },
                  }}
                  series={[{ data: seriesForAttachmentsUploads }]}
                  xAxis={[
                    {
                      scaleType: 'point',
                      data: xLabelsForAttachmentsUploads,
                    },
                  ]}
                  sx={{
                    [`.${lineElementClasses.root}, .${markElementClasses.root}`]:
                      {
                        strokeWidth: 1,
                      },
                    '.MuiLineElement-series-pvId': {
                      strokeDasharray: '5 5',
                    },
                    '.MuiLineElement-series-uvId': {
                      strokeDasharray: '3 4 5 2',
                    },
                    [`.${markElementClasses.root}:not(.${markElementClasses.highlighted})`]:
                      {
                        fill: '#fff',
                      },
                    [`& .${markElementClasses.highlighted}`]: {
                      stroke: 'none',
                    },
                  }}
                  colors={RedHatStandardColors}
                />
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={3}>
            <InfoCard>
              <div style={{ minHeight: '20rem' }}>
                <Typography variant="h6">Total Uploads</Typography>
                <>
                  <Typography variant="h6" style={{ fontSize: '2rem' }}>
                    {getNumberStats(attachmentUploads)
                      .totalRequestsStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average Uploads Per Day
                  </Typography>
                  <Typography variant="h6" style={{ fontSize: '2rem' }}>
                    {getNumberStats(attachmentUploads)
                      .averageRequestsPerDayStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Maximum Uploads In A Day
                  </Typography>
                  <Typography variant="h6" style={{ fontSize: '2rem' }}>
                    {getNumberStats(attachmentUploads)
                      .maximumRequestsInADayStringValue || 'N/A'}
                  </Typography>
                </>
              </div>
            </InfoCard>
          </Grid>
        </Grid>
      )}
    </div>
  );
};
