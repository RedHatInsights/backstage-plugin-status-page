import { InfoCard } from '@backstage/core-components';
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
import {
  LineChart,
  lineElementClasses,
  markElementClasses,
} from '@mui/x-charts';
import React, { useEffect, useState } from 'react';
import { RedHatErrorRedShades, SplunkTimePeriods } from '../Generic';
import { devexApiRef } from '../../api';
import { useApi } from '@backstage/core-plugin-api';
import { KeyValue } from '../../Interfaces';

interface IProps {
  subgraphs: KeyValue;
}

export const ErrorRateTrendLineChart = (props: IProps) => {
  const splunk = useApi(devexApiRef);
  const [selectedSubgraph, setSelectedSubgraph] = useState<string>('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    SplunkTimePeriods[3].id,
  );
  const [statistics, setStatistics] = useState<[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [series, setSeries] = useState([]);
  const [xLabels, setXLabels] = useState<string[]>([]);

  const getLocaleNumberString = (totalFailures: number) => {
    if (!totalFailures) return 'N/A';

    let stringValue = `${totalFailures.toLocaleString('en-US')}`;
    const million = 1000000;
    if (totalFailures > million) {
      stringValue = `${(totalFailures / million).toFixed(1)} Million`;
    }
    return stringValue;
  };

  const getTimedStats = () => {
    let timedStats: { [key: string]: string }[] = [];
    if (selectedTimePeriod && selectedTimePeriod !== '6') {
      timedStats = [...statistics].splice(
        statistics.length - parseInt(selectedTimePeriod, 10),
      );
    } else timedStats = statistics;

    return timedStats;
  };

  const formatLineChartData = () => {
    try {
      const timedStats = getTimedStats();
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

  const getNumberStats = () => {
    const timedStats = getTimedStats();
    let totalFailures = 0;
    let totalFailuresPerClient: { [key: string]: number } = {};
    timedStats.forEach(stat => {
      let currentStatTotalFailures = 0;
      Object.keys(stat).forEach(name => {
        if (!['_span', '_spandays', '_time', 'NULL'].includes(name)) {
          currentStatTotalFailures += parseInt(stat[name], 10);
          totalFailuresPerClient = {
            ...totalFailuresPerClient,
            [name]: totalFailuresPerClient[name]
              ? totalFailuresPerClient[name] + parseInt(stat[name], 10)
              : parseInt(stat[name], 10),
          };
        }
      });
      totalFailures += currentStatTotalFailures;
    });
    const totalQueryFailuresStringValue = getLocaleNumberString(totalFailures);

    const averageQueryFailuresPerDay = Math.ceil(
      totalFailures / parseInt(selectedTimePeriod, 10),
    );
    const averageQueryFailuresPerDayStringValue = getLocaleNumberString(
      averageQueryFailuresPerDay,
    );

    const sortedEntries = Object.entries(totalFailuresPerClient).sort(
      (valueA, valueB) => valueB[1] - valueA[1],
    );
    const sortedObject = Object.fromEntries(sortedEntries);
    let averageRequestsPerClient: { [key: string]: string } = {};

    Object.keys(sortedObject).forEach(client => {
      averageRequestsPerClient = {
        ...averageRequestsPerClient,
        [client]: getLocaleNumberString(totalFailuresPerClient[client]),
      };
    });

    return {
      totalQueryFailuresStringValue,
      averageQueryFailuresPerDayStringValue,
      averageRequestsPerClient,
    };
  };

  const getFilters = () => {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <FormControl variant="outlined" size="small">
          <InputLabel id="Subgraph">Subgraph</InputLabel>
          <Select
            labelId="Subgraph"
            label="Subgraph"
            value={
              selectedSubgraph
                ? selectedSubgraph
                : Object.keys(props.subgraphs)[0]
            }
            onChange={evt => {
              setSelectedSubgraph(`${evt.target.value}`);
            }}
          >
            {Object.keys(props.subgraphs).map((subgraph: string) => (
              <MenuItem value={subgraph}>{props.subgraphs[subgraph]}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
            {SplunkTimePeriods.slice(3).map(period => (
              <MenuItem value={period.id}>{period.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  };

  const fetchErrorRatesData = async () => {
    try {
      setLoadingStats(true);
      const response = await splunk.getErrorRatesBySubgraph(
        selectedSubgraph || Object.keys(props.subgraphs)[0],
      );
      if (
        response?.data?.searchData &&
        JSON.parse(response?.data?.searchData).data?.length
      ) {
        setStatistics(JSON.parse(response?.data?.searchData).data);
        setLoadingStats(false);
      } else {
        setStatistics([]);
        setSeries([]);
        setXLabels([]);
        setLoadingStats(false);
      }
    } catch (err) {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (selectedSubgraph || props.subgraphs) fetchErrorRatesData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.subgraphs, selectedSubgraph]);

  useEffect(() => {
    if (statistics.length) formatLineChartData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statistics, selectedTimePeriod]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <InfoCard>
            <div style={{ minHeight: '32rem' }}>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div>
                  <span style={{ color: 'red' }}>[Error Rates]</span> Per Client
                  For {props.subgraphs[selectedSubgraph]} Subgraph
                </div>
                <div>{getFilters()}</div>
              </Typography>
              <Divider style={{ margin: '0.5rem' }} />
              {loadingStats ? (
                <LinearProgress />
              ) : (
                <LineChart
                  height={450}
                  margin={{ left: 100, bottom: 130 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'bottom', horizontal: 'middle' },
                    },
                  }}
                  series={series}
                  xAxis={[{ scaleType: 'point', data: xLabels }]}
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
                  colors={RedHatErrorRedShades}
                />
              )}
            </div>
          </InfoCard>
        </Grid>
        <Grid item xs={3}>
          <InfoCard>
            <div style={{ minHeight: '32rem' }}>
              <Typography variant="h6">Total Query failures</Typography>
              {loadingStats ? (
                <LinearProgress />
              ) : (
                <>
                  <Typography variant="h2">
                    {getNumberStats().totalQueryFailuresStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average Query failures Per Day
                  </Typography>
                  <Typography variant="h2">
                    {getNumberStats().averageQueryFailuresPerDayStringValue ||
                      'N/A'}
                  </Typography>
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Total Query Failures per Client
                  </Typography>

                  {Object.keys(getNumberStats().averageRequestsPerClient).length
                    ? Object.keys(
                        getNumberStats().averageRequestsPerClient,
                      ).map(
                        (client, index) =>
                          index < 7 && (
                            <Grid container spacing={2}>
                              <Grid item xs={9}>
                                <Chip
                                  label={client}
                                  key={`${index}_client-name-chip__id`}
                                  size="small"
                                />
                                {/* {client} */}
                              </Grid>
                              <Grid item xs={3} style={{ textAlign: 'right' }}>
                                {
                                  getNumberStats().averageRequestsPerClient[
                                    client
                                  ]
                                }
                              </Grid>
                            </Grid>
                          ),
                      )
                    : 'N/A'}
                </>
              )}
            </div>
          </InfoCard>
        </Grid>
      </Grid>
    </>
  );
};
