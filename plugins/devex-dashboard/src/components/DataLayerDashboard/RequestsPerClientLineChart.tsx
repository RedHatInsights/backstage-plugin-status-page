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
import { useEffect, useState } from 'react';
import { RedHatStandardColors, SplunkTimePeriods } from '../Generic';
import { KeyValue } from '../../Interfaces';

interface IProps {
  subgraphs: KeyValue;
  statistics: KeyValue[];
  fetchStatsForSubgraph(subgraph: string): void;
  loading: boolean;
}

export const RequestPerClientLineChart = (props: IProps) => {
  const [selectedSubgraph, setSelectedSubgraph] = useState<string>('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    SplunkTimePeriods[0].id,
  );

  const [series, setSeries] = useState([]);
  const [xLabels, setXLabels] = useState<string[]>([]);

  const getLocaleNumberString = (totalRequests: number) => {
    const averageRequestPerDay = Math.ceil(
      totalRequests / parseInt(selectedTimePeriod, 10),
    );
    let averageRequestPerDayStringValue = `${averageRequestPerDay.toLocaleString(
      'en-US',
    )}`;
    const million = 1000000;
    if (averageRequestPerDay > million) {
      averageRequestPerDayStringValue = `${(
        averageRequestPerDay / million
      ).toFixed(1)} Million`;
    }
    return averageRequestPerDayStringValue;
  };

  const getTimedStats = () => {
    let timedStats: { [key: string]: string }[] = [];
    if (selectedTimePeriod && selectedTimePeriod !== '6') {
      timedStats = [...props.statistics].splice(
        props.statistics.length - parseInt(selectedTimePeriod, 10),
      );
    } else timedStats = props.statistics;

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
              props.fetchStatsForSubgraph(`${evt.target.value}`);
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
            {SplunkTimePeriods.map(period => (
              <MenuItem value={period.id}>{period.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  };

  useEffect(() => {
    if (props.statistics) formatLineChartData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.statistics, selectedTimePeriod]);

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
                  Number of Queries Per Client on{' '}
                  {props.subgraphs[selectedSubgraph]} Subgraph
                </div>
                <div>{getFilters()}</div>
              </Typography>
              <Divider style={{ margin: '0.5rem' }} />
              {props.loading ? (
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
                  colors={RedHatStandardColors}
                />
              )}
            </div>
          </InfoCard>
        </Grid>
        <Grid item xs={3}>
          <InfoCard>
            <div style={{ minHeight: '32rem' }}>
              <Typography variant="h6">Average Queries Per Day</Typography>
              {props.loading ? (
                <LinearProgress />
              ) : (
                <>
                  <Typography variant="h2">
                    {getNumberStats().averageRequestPerDayStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Daily Average Queries per Client
                  </Typography>

                  {Object.keys(getNumberStats().averageRequestsPerClient).length
                    ? Object.keys(
                        getNumberStats().averageRequestsPerClient,
                      ).map(
                        (client, index) =>
                          index < 10 && (
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
