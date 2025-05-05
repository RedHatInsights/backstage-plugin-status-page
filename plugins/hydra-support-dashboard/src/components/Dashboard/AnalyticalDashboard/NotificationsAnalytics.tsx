import { InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Chip,
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
  LineChart,
  lineElementClasses,
  markElementClasses,
} from '@mui/x-charts';
import {
  ChartTimePeriods,
  RedHatStandardColors,
  getLocaleNumberString,
} from '../constants';

export enum NotificationsApiEndpoints {
  ActiveUsers = 'active-users',
  NotificationsServed = 'count',
  NotificationsPerChannel = 'by-channel',
}
export const NotificationsAnalytics = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [seriesForNotificationsServed, setSeriesForNotificationsServed] =
    useState<number[]>([]);
  const [xLabelsForNotificationsServed, setXLabelsForNotificationsServed] =
    useState<string[]>([]);

  const [series, setSeries] = useState<any>([]);
  const [xLabels, setXLabels] = useState<string[]>([]);

  const dataLayerApi = useApi(dataLayerApiRef);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    ChartTimePeriods[0].id,
  );
  const [activeUsers, setActiveUsers] = useState(0);
  const [notificationsServedData, setNotificationsServedData] = useState<[]>(
    [],
  );
  const [notificationsPerChannel, setNotificationsPerChannel] = useState<[]>(
    [],
  );

  const fetchNotificationsStats = async () => {
    try {
      setLoadingData(true);
      const activeUsersResponse =
        await dataLayerApi.getNotificationsSplunkStats(
          NotificationsApiEndpoints.ActiveUsers,
        );
      const notificationsServedResponse =
        await dataLayerApi.getNotificationsSplunkStats(
          NotificationsApiEndpoints.NotificationsServed,
        );
      const notificationsPerChannelResponse =
        await dataLayerApi.getNotificationsSplunkStats(
          NotificationsApiEndpoints.NotificationsPerChannel,
        );
      if (activeUsersResponse?.data && activeUsersResponse.data?.searchData) {
        const stringCount: any = Object.values(
          JSON.parse(activeUsersResponse.data?.searchData).data[0],
        )[0];
        parseInt(stringCount, 10);
        setActiveUsers(stringCount ? parseInt(stringCount, 10) : 0);
      }

      if (
        notificationsServedResponse?.data &&
        notificationsServedResponse.data?.searchData
      ) {
        setNotificationsServedData(
          JSON.parse(notificationsServedResponse.data?.searchData).data,
        );
      }

      if (
        notificationsPerChannelResponse?.data &&
        notificationsPerChannelResponse.data?.searchData
      ) {
        setNotificationsPerChannel(
          JSON.parse(notificationsPerChannelResponse.data?.searchData).data,
        );
      }
      setLoadingData(false);
    } catch (err) {
      setActiveUsers(0);
      setNotificationsPerChannel([]);
      setNotificationsServedData([]);
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

  const getNumberStats = (statistics: any[]) => {
    const timedStats = getTimedStats(statistics);
    let maximumRequestInADay = 0;
    let totalRequests = 0;

    timedStats.forEach(stat => {
      const count = parseInt(stat['Notifications Sent'], 10);
      totalRequests += count;
      if (count > maximumRequestInADay) maximumRequestInADay = count;
    });

    const totalNotificationsStringValue = getLocaleNumberString(totalRequests);
    const maximumNotificationsInADayStringValue =
      getLocaleNumberString(maximumRequestInADay);
    const averageRequestPerDay = Math.ceil(
      totalRequests / parseInt(selectedTimePeriod, 10),
    );
    const averageNotificationsPerDayStringValue =
      getLocaleNumberString(averageRequestPerDay);

    return {
      totalNotificationsStringValue,
      averageNotificationsPerDayStringValue,
      maximumNotificationsInADayStringValue,
    };
  };

  const getNumberStatsForChannel = () => {
    const timedStats = getTimedStats(notificationsPerChannel);
    let totalRequests = 0;
    let totalRequestsPerClient: { [key: string]: number } = {};
    timedStats.forEach(stat => {
      let currentStatTotalRequests = 0;
      Object.keys(stat).forEach(name => {
        if (!['_span', '_spandays', '_time', 'NULL'].includes(name)) {
          currentStatTotalRequests += parseInt(stat[name], 10);
          totalRequestsPerClient = {
            ...totalRequestsPerClient,
            [name]: totalRequestsPerClient[name]
              ? totalRequestsPerClient[name] + parseInt(stat[name], 10)
              : parseInt(stat[name], 10),
          };
        }
      });
      totalRequests += currentStatTotalRequests;
    });
    const averageRequestPerDayStringValue =
      getLocaleNumberString(totalRequests);

    const sortedEntries = Object.entries(totalRequestsPerClient).sort(
      (valueA, valueB) => valueB[1] - valueA[1],
    );
    const sortedObject = Object.fromEntries(sortedEntries);
    let averageRequestsPerClient: { [key: string]: string } = {};

    Object.keys(sortedObject).forEach(client => {
      averageRequestsPerClient = {
        ...averageRequestsPerClient,
        [client]: getLocaleNumberString(totalRequestsPerClient[client]),
      };
    });

    return { averageRequestPerDayStringValue, averageRequestsPerClient };
  };

  const formatLineChartDataForNotificationsServed = () => {
    try {
      const timedStats = getTimedStats(notificationsServedData);
      const requestDates: string[] = [];
      const chartSeries: number[] = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(new Date(stats._time).toDateString());

        chartSeries.push(parseInt(stats['Notifications Sent'], 10));
      });

      setSeriesForNotificationsServed(chartSeries);
      setXLabelsForNotificationsServed(requestDates);
    } catch (_err) {
      setSeriesForNotificationsServed([]);
      setXLabelsForNotificationsServed([]);
    }
  };

  const formatLineChartDataForNotificationsPerChannel = () => {
    try {
      const timedStats = getTimedStats(notificationsPerChannel);
      const requestDates: string[] = [];
      const clientRequestByName: { [key: string]: number[] } = {};
      timedStats?.forEach((stats: { [key: string]: string }) => {
        const clientNames = Object.keys(stats);
        requestDates.push(new Date(stats._time).toDateString());
        clientNames.forEach(name => {
          if (!['_span', '_spandays', '_time', 'NULL'].includes(name)) {
            if (clientRequestByName[name]) {
              clientRequestByName[name] = [
                ...clientRequestByName[name],
                parseInt(stats[name], 10),
              ];
            } else {
              clientRequestByName[name] = [parseInt(stats[name], 10)];
            }
          }
        });
      });

      const chartSeries: any = [];

      Object.keys(clientRequestByName).forEach(name => {
        chartSeries.push({
          data: clientRequestByName[name],
          label: name,
          id: `${name}__Id`,
        });
      });
      setSeries(chartSeries);
      setXLabels(requestDates);
    } catch (_err) {
      setSeries([]);
      setXLabels([]);
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
    fetchNotificationsStats();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notificationsServedData.length)
      formatLineChartDataForNotificationsServed();
    if (notificationsPerChannel.length)
      formatLineChartDataForNotificationsPerChannel();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsServedData, selectedTimePeriod, notificationsPerChannel]);

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
          <Typography variant="h3">
            <div>Notifications Analytics</div>
          </Typography>
        </div>
        <div>{getFilters()}</div>
      </div>
      {loadingData ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <InfoCard>
              <Typography variant="h3" style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{activeUsers}</span> Active
                Users for Past 6 Months
              </Typography>
            </InfoCard>
          </Grid>
          <Grid item xs={9}>
            <InfoCard>
              <div style={{ maxHeight: '20rem' }}>
                <Typography
                  variant="h5"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Notifications Served Per Day</div>
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
                  series={[{ data: seriesForNotificationsServed }]}
                  xAxis={[
                    {
                      scaleType: 'point',
                      data: xLabelsForNotificationsServed,
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
                <Typography variant="h6">Total Notifications Sent</Typography>
                <>
                  <Typography variant="h2">
                    {getNumberStats(notificationsServedData)
                      .totalNotificationsStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average Notifications Per Day
                  </Typography>
                  <Typography variant="h2">
                    {getNumberStats(notificationsServedData)
                      .averageNotificationsPerDayStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Maximum Notifications In A Day
                  </Typography>
                  <Typography variant="h2">
                    {getNumberStats(notificationsServedData)
                      .maximumNotificationsInADayStringValue || 'N/A'}
                  </Typography>
                </>
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={9}>
            <InfoCard>
              <div style={{ minHeight: '25rem' }}>
                <Typography
                  variant="h5"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Notifications Sent Per Channel</div>
                  <div>{}</div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <LineChart
                  height={350}
                  margin={{ left: 100, bottom: 80 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'bottom', horizontal: 'middle' },
                    },
                  }}
                  series={series}
                  xAxis={[{ scaleType: 'point', data: xLabels || [] }]}
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
              <div style={{ minHeight: '25rem' }}>
                <>
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Notifications Sent Per Channel
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />

                  {Object.keys(
                    getNumberStatsForChannel().averageRequestsPerClient,
                  ).length
                    ? Object.keys(
                        getNumberStatsForChannel().averageRequestsPerClient,
                      ).map(
                        (client, index) =>
                          index < 10 && (
                            <Grid container spacing={2}>
                              <Grid item xs={8}>
                                <Chip
                                  label={client}
                                  key={`${index}_client-name-chip__id`}
                                  size="small"
                                />
                                {/* {client} */}
                              </Grid>
                              <Grid item xs={4} style={{ textAlign: 'right' }}>
                                {
                                  getNumberStatsForChannel()
                                    .averageRequestsPerClient[client]
                                }
                              </Grid>
                            </Grid>
                          ),
                      )
                    : 'N/A'}
                </>
              </div>
            </InfoCard>
          </Grid>
        </Grid>
      )}
    </div>
  );
};
