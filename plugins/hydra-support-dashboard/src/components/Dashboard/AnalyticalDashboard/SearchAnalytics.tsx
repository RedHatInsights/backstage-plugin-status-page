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
import { useEffect, useState } from 'react';
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

export enum SearchApiEndpoints {
  UniqueUsers = 'search/unique-users',
  Requests = 'search/requests',
}
export const SearchAnalytics = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [seriesForSearchRequests, setSeriesForSearchRequests] = useState([]);
  const [xLabelsForSearchRequests, setXLabelsForSearchRequests] = useState<
    string[]
  >([]);

  const [seriesForUniqueUsers, setSeriesForUniqueUsers] = useState<number[]>(
    [],
  );
  const [xLabelsForUniqueUsers, setXLabelsForUniqueUsers] = useState<string[]>(
    [],
  );

  const dataLayerApi = useApi(dataLayerApiRef);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    ChartTimePeriods[0].id,
  );
  const [uniqueUsers, setUniqueUsers] = useState<[]>([]);
  const [searchRequest, setSearchRequest] = useState<[]>([]);
  const [lastUpdatedOn, setLastUpdatedOn] = useState<string>('');
  const isButtonDisabled = true;

  const fetchRestStats = async () => {
    try {
      setLoadingData(true);
      const uniqueUsersResponse = await dataLayerApi.getHydraSplunkStats(
        SearchApiEndpoints.UniqueUsers,
      );
      const searchRequestResponse = await dataLayerApi.getHydraSplunkStats(
        SearchApiEndpoints.Requests,
      );

      if (uniqueUsersResponse?.data && uniqueUsersResponse.data?.searchData) {
        setUniqueUsers(JSON.parse(uniqueUsersResponse.data?.searchData).data);
        setLastUpdatedOn(
          new Date(uniqueUsersResponse?.data?.lastUpdatedOn).toDateString(),
        );
      }

      if (
        searchRequestResponse?.data &&
        searchRequestResponse.data?.searchData
      ) {
        setSearchRequest(
          JSON.parse(searchRequestResponse.data?.searchData).data,
        );
      }
      setLoadingData(false);
    } catch (_err) {
      setUniqueUsers([]);
      setSearchRequest([]);
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
      const count = parseInt(stats['distinct_count(AuthenticatedUser)'], 10);
      totalUserCount += count;
      totalUsersExcludingWeekends += count;
      workingDays++;
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
    let totalSearchRequests = 0;
    let workingDays: number = 0;
    timedStats.forEach(stat => {
      totalSearchRequests += parseInt(stat.count, 10);
      workingDays++;
    });

    const averageRequestsPerDayStringValue = getLocaleNumberString(
      Math.ceil(totalSearchRequests / workingDays),
    );

    const totalSearchRequestsStringValue =
      getLocaleNumberString(totalSearchRequests);
    return { averageRequestsPerDayStringValue, totalSearchRequestsStringValue };
  };

  const formatLineChartDataForUniqueUsers = () => {
    try {
      const timedStats = getTimedStats(uniqueUsers);
      const requestDates: string[] = [];
      const chartSeries: number[] = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(new Date(stats._time).toDateString());
        chartSeries.push(
          parseInt(stats['distinct_count(AuthenticatedUser)'], 10),
        );
      });

      setSeriesForUniqueUsers(chartSeries);
      setXLabelsForUniqueUsers(requestDates);
    } catch (_err) {
      setSeriesForUniqueUsers([]);
      setXLabelsForUniqueUsers([]);
    }
  };

  const formatCaseCreationLineChart = () => {
    try {
      const timedStats = getTimedStats(searchRequest);
      const requestDates: string[] = [];
      const chartSeries: any = [];
      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(new Date(stats._time).toDateString());
        chartSeries.push(parseInt(stats.count, 10));
      });

      setSeriesForSearchRequests(chartSeries);
      setXLabelsForSearchRequests(requestDates);
    } catch (_err) {
      setSeriesForSearchRequests([]);
      setXLabelsForSearchRequests([]);
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
    fetchRestStats();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchRequest.length) formatCaseCreationLineChart();
    if (uniqueUsers.length) formatLineChartDataForUniqueUsers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchRequest, uniqueUsers, selectedTimePeriod]);

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
          <Typography
            variant="h3"
            style={{
              display: 'flex',
              gap: '1rem',
            }}
          >
            <div>Hydra Search Analytics</div>
            <div>
              <Button size="small" disabled={isButtonDisabled}>
                {`Last updated on: ${lastUpdatedOn}`}
              </Button>
            </div>
          </Typography>
        </div>
        {getFilters()}
      </div>
      {loadingData ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <InfoCard>
              <div style={{ height: '15rem' }}>
                <Typography
                  variant="h5"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Hydra Search Daily Unique Users</div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <BarChart
                  height={240}
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
                <Typography variant="h6">
                  <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                    {
                      getNumberStatsForUniqueUsers()
                        .totalUserActivitiesStringValue
                    }
                  </div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <Typography variant="h6">
                  <div>Avg. Daily Unique Users</div>
                </Typography>
                <Typography variant="h6">
                  <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                    {
                      getNumberStatsForUniqueUsers()
                        .dailyAverageUniqueUsersStringValue
                    }
                  </div>
                </Typography>
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={9}>
            <InfoCard>
              <div style={{ height: '15rem' }}>
                <Typography
                  variant="h5"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Hydra Search - Requests</div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />
                <LineChart
                  height={240}
                  margin={{ left: 100, bottom: 50 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'bottom', horizontal: 'middle' },
                    },
                  }}
                  series={[{ data: seriesForSearchRequests }]}
                  xAxis={[
                    {
                      scaleType: 'point',
                      data: xLabelsForSearchRequests,
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
              <div style={{ height: '15rem' }}>
                <Typography variant="h4">Total Search Requests</Typography>
                <>
                  <Typography variant="h6">
                    <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                      {getNumberStats(searchRequest)
                        .totalSearchRequestsStringValue || 'N/A'}
                    </div>
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Avg. Daily Search Requests
                  </Typography>
                  <Typography variant="h6">
                    <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                      {getNumberStats(searchRequest)
                        .averageRequestsPerDayStringValue || 'N/A'}
                    </div>
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
