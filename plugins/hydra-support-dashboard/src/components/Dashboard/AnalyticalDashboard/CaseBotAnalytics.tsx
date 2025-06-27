import { InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Button,
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
import { useEffect, useState } from 'react';
import { dataLayerApiRef } from '../../../api';
import { BarChart } from '@mui/x-charts';
import {
  ChartTimePeriods,
  MonthNames,
  RedHatStandardColors,
  getLocaleNumberString,
} from '../constants';

export enum CaseBotApiEndpoints {
  UniqueUsers = 'casebot/unique-users',
  Commands = 'casebot/commands',
}
export const CaseBotAnalytics = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [seriesForCommandsFrequency, setSeriesForCommandsFrequency] = useState(
    [],
  );
  const [xLabelsForCommandsFrequency, setXLabelsForCommandsFrequency] =
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
  const selectedTimePeriod = ChartTimePeriods[0].id;
  const [uniqueUsers, setUniqueUsers] = useState<[]>([]);
  const [commandsFrequency, setCommandsFrequency] = useState<[]>([]);
  const isFilterDisabled = true;

  const fetchCaseBotStats = async () => {
    try {
      setLoadingData(true);
      const uniqueUsersResponse = await dataLayerApi.getHydraSplunkStats(
        CaseBotApiEndpoints.UniqueUsers,
      );
      const commandsFrequencyResponse = await dataLayerApi.getHydraSplunkStats(
        CaseBotApiEndpoints.Commands,
      );

      if (uniqueUsersResponse?.data && uniqueUsersResponse.data?.searchData) {
        setUniqueUsers(JSON.parse(uniqueUsersResponse.data?.searchData).data);
        setLastUpdatedOn(
          new Date(uniqueUsersResponse?.data?.lastUpdatedOn).toDateString(),
        );
      }

      if (
        commandsFrequencyResponse?.data &&
        commandsFrequencyResponse.data?.searchData
      ) {
        setCommandsFrequency(
          JSON.parse(commandsFrequencyResponse.data?.searchData).data,
        );
      }
      setLoadingData(false);
    } catch (_err) {
      setUniqueUsers([]);
      setCommandsFrequency([]);
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
      const count = parseInt(stats['#Users'], 10);
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
    let totalFrequencies = 0;
    let totalFrequenciesPerCommand: { [key: string]: number } = {};
    timedStats.forEach(stat => {
      let currentStatTotalFrequencies = 0;
      Object.keys(stat).forEach(name => {
        if (!['_span', '_spandays', '_time', 'NULL'].includes(name)) {
          currentStatTotalFrequencies += parseInt(stat[name], 10);
          totalFrequenciesPerCommand = {
            ...totalFrequenciesPerCommand,
            [name]: totalFrequenciesPerCommand[name]
              ? totalFrequenciesPerCommand[name] + parseInt(stat[name], 10)
              : parseInt(stat[name], 10),
          };
        }
      });
      totalFrequencies += currentStatTotalFrequencies;
    });
    const averageRequestPerDayStringValue =
      getLocaleNumberString(totalFrequencies);

    const sortedEntries = Object.entries(totalFrequenciesPerCommand).sort(
      (valueA, valueB) => valueB[1] - valueA[1],
    );
    const sortedObject = Object.fromEntries(sortedEntries);
    let averageFrequenciesPerCommand: { [key: string]: string } = {};

    Object.keys(sortedObject).forEach(client => {
      if (client !== 'OTHER')
        averageFrequenciesPerCommand = {
          ...averageFrequenciesPerCommand,
          [client]: getLocaleNumberString(totalFrequenciesPerCommand[client]),
        };
    });
    if (totalFrequenciesPerCommand?.OTHER)
      averageFrequenciesPerCommand = {
        ...averageFrequenciesPerCommand,
        ['OTHER']: getLocaleNumberString(totalFrequenciesPerCommand.OTHER),
      };

    return { averageRequestPerDayStringValue, averageFrequenciesPerCommand };
  };

  const formatLineChartDataForUniqueUsers = () => {
    try {
      const timedStats = getTimedStats(uniqueUsers);
      const requestDates: string[] = [];
      const chartSeries: number[] = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(MonthNames[new Date(stats._time).getMonth()]);

        chartSeries.push(parseInt(stats['#Users'], 10));
      });

      setSeriesForUniqueUsers(chartSeries);
      setXLabelsForUniqueUsers(requestDates);
    } catch (_err) {
      setSeriesForUniqueUsers([]);
      setXLabelsForUniqueUsers([]);
    }
  };

  const formatCommandsFrequencyLineChart = () => {
    try {
      const timedStats = getTimedStats(commandsFrequency);
      const requestDates: string[] = [];
      const clientRequestByName: { [key: string]: number[] } = {};
      timedStats?.forEach((stats: { [key: string]: string }) => {
        const clientNames = Object.keys(stats);
        requestDates.push(MonthNames[new Date(stats._time).getMonth()]);
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
          stack: 'total',
        });
      });

      setSeriesForCommandsFrequency(chartSeries);
      setXLabelsForCommandsFrequency(requestDates);
    } catch (_err) {
      setSeriesForCommandsFrequency([]);
      setXLabelsForCommandsFrequency([]);
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
            disabled={isFilterDisabled}
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
    fetchCaseBotStats();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (commandsFrequency.length) formatCommandsFrequencyLineChart();
    if (uniqueUsers.length) formatLineChartDataForUniqueUsers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandsFrequency, uniqueUsers]);

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
            <div>CaseBot Analytics</div>
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
              <div style={{ height: '15rem' }}>
                <Typography
                  variant="h5"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>CaseBot Monthly Active Users</div>
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
                  <div>Avg. Monthly Active Users</div>
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
              <div style={{ height: '32rem' }}>
                <Typography
                  variant="h6"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>Frequency per Command on CaseBot</div>
                </Typography>
                <Divider style={{ margin: '0.5rem' }} />

                <BarChart
                  height={480}
                  margin={{ left: 100, top: 100 }}
                  series={seriesForCommandsFrequency}
                  yAxis={[
                    { scaleType: 'band', data: xLabelsForCommandsFrequency },
                  ]}
                  layout="horizontal"
                  colors={RedHatStandardColors}
                />
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={3}>
            <InfoCard>
              <div style={{ height: '32rem' }}>
                <Typography variant="h6">Total Commands</Typography>
                <>
                  <Typography variant="h6">
                    <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                      {getNumberStats(commandsFrequency)
                        .averageRequestPerDayStringValue || 'N/A'}
                    </div>
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Frequency per Command (top 10)
                  </Typography>
                  {Object.keys(
                    getNumberStats(commandsFrequency)
                      .averageFrequenciesPerCommand,
                  ).length
                    ? Object.keys(
                        getNumberStats(commandsFrequency)
                          .averageFrequenciesPerCommand,
                      ).map(
                        (client, index) =>
                          index < 10 && (
                            <Grid container spacing={2}>
                              <Grid item xs={9}>
                                <Chip
                                  label={client}
                                  key={`${index}_command-name-chip__id`}
                                  size="small"
                                />
                                {/* {client} */}
                              </Grid>
                              <Grid
                                item
                                xs={3}
                                style={{
                                  textAlign: 'right',
                                }}
                              >
                                {
                                  getNumberStats(commandsFrequency)
                                    .averageFrequenciesPerCommand[client]
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
