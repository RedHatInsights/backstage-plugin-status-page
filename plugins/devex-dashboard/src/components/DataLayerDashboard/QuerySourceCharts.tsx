import { InfoCard } from '@backstage/core-components';
import {
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
import { RedHatStandardColors, SplunkTimePeriods } from '../Generic';
import { devexApiRef } from '../../api';
import { useApi } from '@backstage/core-plugin-api';
import { AccessTypes } from '../Generic/Constants';

export const QuerySourceCharts = () => {
  const splunk = useApi(devexApiRef);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    SplunkTimePeriods[0].id,
  );

  const [selectedAccessType, setSelectedAccessType] = useState<string>(
    AccessTypes.Public,
  );
  const [publicData, setPublicData] = useState([]);
  const [internalData, setInternalData] = useState([]);

  const [loadingStats, setLoadingStats] = useState(false);
  const [series, setSeries] = useState<any[]>([]);
  const [xLabels, setXLabels] = useState<string[]>([]);

  const getLocaleNumberString = (totalRequests: number) => {
    let stringValue = `${totalRequests.toLocaleString('en-US')}`;
    const million = 1000000;
    if (totalRequests > million) {
      stringValue = `${(totalRequests / million).toFixed(1)} Million`;
    }
    return stringValue;
  };

  const getTimedStats = () => {
    let timedStats: { [key: string]: string }[] = [];
    const statistics =
      selectedAccessType === 'Internal' ? internalData : publicData;
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
      const chartSeries: any = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        const clientNames = Object.keys(stats);
        requestDates.push(new Date(stats._time).toDateString());
        let currentTotalQueries = 0;
        clientNames.forEach(name => {
          if (!['_span', '_spandays', '_time', 'NULL'].includes(name)) {
            currentTotalQueries += parseInt(stats[name], 10);
          }
        });
        chartSeries.push(currentTotalQueries);
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
    let maximumQueriesInADay = 0;
    let totalQueries = 0;

    timedStats.forEach(stats => {
      const clientNames = Object.keys(stats);
      let currentTotalQueries = 0;
      clientNames.forEach(name => {
        if (!['_span', '_spandays', '_time', 'NULL'].includes(name)) {
          currentTotalQueries += parseInt(stats[name], 10);
        }
      });
      totalQueries += currentTotalQueries;
      if (currentTotalQueries > maximumQueriesInADay)
        maximumQueriesInADay = currentTotalQueries;
    });

    const totalQueriesStringValue = getLocaleNumberString(totalQueries);
    const maximumQueriesInADayStringValue =
      getLocaleNumberString(maximumQueriesInADay);
    const averageQueriesPerDay = Math.ceil(
      totalQueries / parseInt(selectedTimePeriod, 10),
    );
    const averageQueriesPerDayStringValue =
      getLocaleNumberString(averageQueriesPerDay);

    return {
      totalQueriesStringValue,
      averageQueriesPerDayStringValue,
      maximumQueriesInADayStringValue,
    };
  };

  const getFilters = () => {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <FormControl variant="outlined" size="small">
          <InputLabel id="Period">Access Type</InputLabel>
          <Select
            labelId="AccessType"
            label="Access Type"
            value={selectedAccessType}
            onChange={evt => {
              setSelectedAccessType(`${evt.target.value}`);
            }}
          >
            {Object.keys(AccessTypes).map(type => (
              <MenuItem value={type}>{type}</MenuItem>
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

  const fetchGateWayRequestData = async () => {
    try {
      setLoadingStats(true);
      const response = await splunk.getGatewayRequestResponseData(
        'query-source',
      );

      if (response?.data) {
        const data = response?.data;
        if (data?.external && data?.external.searchData) {
          setPublicData(JSON.parse(data?.external.searchData)?.data);
        }
        if (data?.internal && data?.internal.searchData) {
          setInternalData(JSON.parse(data?.internal.searchData)?.data);
        }
        setLoadingStats(false);
      }
    } catch (err) {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchGateWayRequestData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      (selectedAccessType === AccessTypes.Internal && internalData.length) ||
      (selectedAccessType === AccessTypes.Public && publicData.length)
    )
      formatLineChartData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicData, internalData, selectedAccessType, selectedTimePeriod]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <InfoCard>
            <div style={{ maxHeight: '25rem' }}>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div>
                  [Gateway] Number of Queries By Access Type (
                  {selectedAccessType})
                </div>
                <div>{getFilters()}</div>
              </Typography>
              <Divider style={{ margin: '0.5rem' }} />
              {loadingStats ? (
                <LinearProgress />
              ) : (
                <LineChart
                  height={400}
                  margin={{ left: 100, bottom: 130 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'bottom', horizontal: 'middle' },
                    },
                  }}
                  series={[{ data: series }]}
                  xAxis={[
                    {
                      scaleType: 'point',
                      data: xLabels,
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
              )}
            </div>
          </InfoCard>
        </Grid>
        <Grid item xs={3}>
          <InfoCard>
            <div style={{ minHeight: '25rem' }}>
              <Typography variant="h6">Total Queries</Typography>
              {loadingStats ? (
                <LinearProgress />
              ) : (
                <>
                  <Typography variant="h2">
                    {`${getNumberStats().totalQueriesStringValue}` || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average Queries Per Day
                  </Typography>
                  <Typography variant="h2">
                    {`${getNumberStats().averageQueriesPerDayStringValue}` ||
                      'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Maximum Query In A Day
                  </Typography>
                  <Typography variant="h2">
                    {`${getNumberStats().maximumQueriesInADayStringValue}` ||
                      'N/A'}
                  </Typography>
                </>
              )}
            </div>
          </InfoCard>
        </Grid>
      </Grid>
    </>
  );
};
