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

export const AkamaiRequestTrendLineChart = () => {
  const splunk = useApi(devexApiRef);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    SplunkTimePeriods[0].id,
  );
  const [statistics, setStatistics] = useState<[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [series, setSeries] = useState<number[]>([]);
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
      const chartSeries: number[] = [];

      timedStats?.forEach((stats: { [key: string]: string }) => {
        requestDates.push(new Date(stats._time).toDateString());

        chartSeries.push(parseInt(stats.count, 10));
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
    let maximumRequestInADay = 0;
    let totalRequests = 0;

    timedStats.forEach(stat => {
      const count = parseInt(stat.count, 10);
      totalRequests += count;
      if (count > maximumRequestInADay) maximumRequestInADay = count;
    });

    const totalRequestsStringValue = getLocaleNumberString(totalRequests);
    const maximumRequestInADayStringValue =
      getLocaleNumberString(maximumRequestInADay);
    const averageRequestPerDay = Math.ceil(
      totalRequests / parseInt(selectedTimePeriod, 10),
    );
    const averageRequestPerDayStringValue =
      getLocaleNumberString(averageRequestPerDay);

    return {
      totalRequestsStringValue,
      averageRequestPerDayStringValue,
      maximumRequestInADayStringValue,
    };
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
      const response = await splunk.getGatewayRequestData();
      if (
        response?.data?.searchData &&
        JSON.parse(response?.data?.searchData).data?.length
      ) {
        setStatistics(JSON.parse(response?.data?.searchData).data);
        setLoadingStats(false);
      }
    } catch (err) {setLoadingStats(false);}
  };

  useEffect(() => {
    fetchGateWayRequestData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (statistics.length) formatLineChartData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statistics, selectedTimePeriod]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <InfoCard>
            <div style={{ maxHeight: '22rem' }}>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div>API - Gateway Request Trend</div>
                <div>{getFilters()}</div>
              </Typography>
              <Divider style={{ margin: '0.5rem' }} />
              {loadingStats ? (
                <LinearProgress />
              ) : (
                <LineChart
                  width={1050}
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
            <div style={{ minHeight: '22rem' }}>
              <Typography variant="h6">Total Requests</Typography>
              {loadingStats ? (
                <LinearProgress />
              ) : (
                <>
                  <Typography variant="h2">
                    {getNumberStats().totalRequestsStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average Requests Per Day
                  </Typography>
                  <Typography variant="h2">
                    {getNumberStats().averageRequestPerDayStringValue || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Maximum Requests In A Day
                  </Typography>
                  <Typography variant="h2">
                    {getNumberStats().maximumRequestInADayStringValue || 'N/A'}
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
