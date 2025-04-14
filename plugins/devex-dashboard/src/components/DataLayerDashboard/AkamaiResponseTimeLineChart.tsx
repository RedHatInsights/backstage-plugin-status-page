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
import { SplunkTimePeriods } from '../Generic';
import { devexApiRef } from '../../api';
import { useApi } from '@backstage/core-plugin-api';

export const AkamaiResponseTimeLineChart = () => {
  const splunk = useApi(devexApiRef);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(
    SplunkTimePeriods[0].id,
  );
  const [statistics, setStatistics] = useState<[]>([]);
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
    let averageResponseTime = 0;
    let averageMedianResponseTime = 0;
    let average95thResponseTime = 0;
    timedStats.forEach(stat => {
      averageResponseTime += stat.Average
        ? parseInt(stat.Average, 10)
        : 0;
      averageMedianResponseTime += stat.Median
        ? parseInt(stat.Median, 10)
        : 0;
      average95thResponseTime += stat['95th'] ? parseInt(stat['95th'], 10) : 0;
    });

    averageResponseTime = Math.floor(
      averageResponseTime / parseInt(selectedTimePeriod, 10),
    );
    averageMedianResponseTime = Math.floor(
      averageMedianResponseTime / parseInt(selectedTimePeriod, 10),
    );

    average95thResponseTime = Math.floor(
      average95thResponseTime / parseInt(selectedTimePeriod, 10),
    );

    const averageResponseTimeStringValue =
      getLocaleNumberString(averageResponseTime);
    const averageMedianResponseTimeStringValue = getLocaleNumberString(
      averageMedianResponseTime,
    );
    const average95thResponseTimeStringValue = getLocaleNumberString(
      average95thResponseTime,
    );

    return {
      averageResponseTimeStringValue,
      averageMedianResponseTimeStringValue,
      average95thResponseTimeStringValue,
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
      const response = await splunk.getGatewayRequestResponseData(
        'response-time',
      );
      if (
        response?.data?.searchData &&
        JSON.parse(response?.data?.searchData).data?.length
      ) {
        setStatistics(JSON.parse(response?.data?.searchData).data);
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
    if (statistics.length) formatLineChartData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statistics, selectedTimePeriod]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <InfoCard>
            <div style={{ maxHeight: '32rem' }}>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div>API - Gateway Request Response Time [in milliseconds]</div>
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
                  }}
                  colors={['#63993d', '#ffcc17', '#ee0000']}
                />
              )}
            </div>
          </InfoCard>
        </Grid>
        <Grid item xs={3}>
          <InfoCard>
            <div style={{ minHeight: '32rem' }}>
              <Typography variant="h6">Average Response Time</Typography>
              {loadingStats ? (
                <LinearProgress />
              ) : (
                <>
                  <Typography variant="h2">
                    {`${getNumberStats().averageResponseTimeStringValue} ms` ||
                      'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average Median Response Time
                  </Typography>
                  <Typography variant="h2">
                    {`${
                      getNumberStats().averageMedianResponseTimeStringValue
                    } ms` || 'N/A'}
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Typography variant="h6" style={{ marginBottom: '1rem' }}>
                    Average 95th Response Time
                  </Typography>
                  <Typography variant="h2">
                    {`${
                      getNumberStats().average95thResponseTimeStringValue
                    } ms` || 'N/A'}
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
