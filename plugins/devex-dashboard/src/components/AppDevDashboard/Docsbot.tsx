import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { useEffect, useState } from 'react';
import { devexApiRef } from '../../api';
import { InfoCard, LinkButton } from '@backstage/core-components';
import { MatomoPeriods, RedHatStandardColors } from '../Generic/Constants';
import { LineChart } from '@mui/x-charts';
import OpenInNew from '@material-ui/icons/OpenInNew';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Grid,
  Typography,
  Divider,
} from '@material-ui/core';

function Docsbot() {
  const config = useApi(configApiRef);
  const devExApi = useApi(devexApiRef);

  const [periodOrRange, setPeriodOrRange] = useState(MatomoPeriods[0]);
  const [loading, setLoading] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [docsbotStats, setDocsbotStats] = useState<{
    total_feedback: number;
    likes: number;
    dislikes: number;
  }>();
  const [lineChartLabels, setLineChartLabels] = useState<{
    xLabels: string[];
    yLabels: number[];
  }>({
    xLabels: [],
    yLabels: [],
  });

  const getPluginInterpolationChart = (reportData: any) => {
    try {
      const reportDates: string[] = Object.keys(reportData);
      const xLabels: string[] = reportDates.map(label => label.split(',')[0]);
      const yLabels: number[] = [];
      reportDates.forEach((date: string) => {
        if (reportData[date].length) {
          const foundData = reportData[date].find(
            (data: {
              label: string;
              nb_visits: number;
              avg_time_on_page: string;
            }) => data.label === '/docsbot',
          );
          if (foundData) {
            yLabels.push(foundData.nb_visits);
          } else {
            yLabels.push(0);
          }
        } else {
          yLabels.push(0);
        }
      });

      return { xLabels: xLabels, yLabels: yLabels };
    } catch (_err) {
      return { xLabels: [], yLabels: [] };
    }
  };

  const fetchDocsbotMatomoInsights = async () => {
    try {
      const siteId = config.getString('app.analytics.matomo.siteId');
      const matomoStats = await devExApi.getMatomoPageUrls(
        periodOrRange.period,
        periodOrRange.range,
        siteId
      );
      const { xLabels, yLabels } = getPluginInterpolationChart(
        matomoStats.reportData,
      );

      setLineChartLabels({ xLabels: xLabels, yLabels: yLabels });
      setLoadingInsights(false);
    } catch (_err) {
      setLoadingInsights(false);
    }
  };

  const fetchDocsbotStats = async () => {
    try {
      const docsbotApiResponse = await devExApi.getDocsbotStats();
      setDocsbotStats(docsbotApiResponse);
      setLoading(false);
    } catch (_err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDocsbotStats();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoadingInsights(true);
    fetchDocsbotMatomoInsights();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodOrRange]);

  return (
    <div>
      {loading ? (
        <LinearProgress />
      ) : (
        <div>
          <Typography variant="h3" style={{ marginBottom: '1rem' }}>
            UXE Docsbot Stats
          </Typography>
          <div style={{ marginBottom: '1rem' }}>
            <InfoCard>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Feedbacks Received
                <LinkButton
                  variant="contained"
                  color="primary"
                  to="/docsbot"
                  target="_blank"
                  style={{ padding: '0 0.5rem' }}
                  endIcon={<OpenInNew />}
                >
                  Visit Docsbot
                </LinkButton>
              </Typography>
              <Typography variant="h1">
                {docsbotStats?.total_feedback || 'N/A'}
              </Typography>
              <Divider style={{ marginBottom: '0.5rem' }} />
              <Grid container spacing={2}>
                <Grid item key={`docsbot-stats-grid-${1}`}>
                  <Typography
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    Positive
                  </Typography>
                  <Typography style={{ fontSize: '24px' }}>
                    {docsbotStats?.likes || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item key={`docsbot-stats-grid-${2}`}>
                  <Typography
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    Critical
                  </Typography>
                  <Typography style={{ fontSize: '24px' }}>
                    {docsbotStats?.dislikes || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </InfoCard>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <InfoCard>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                UXE Docsbot Engagement Trend
                <div>
                  <FormControl variant="outlined" size="small">
                    <InputLabel id="period">Period</InputLabel>
                    <Select
                      labelId="period"
                      label="period"
                      value={periodOrRange.title}
                      onChange={evt => {
                        const selectedPeriod: any = evt.target.value;
                        const selectedItem = MatomoPeriods.find(
                          item => item.title === selectedPeriod,
                        );

                        setPeriodOrRange({
                          ...periodOrRange,
                          period: selectedItem?.period || '',
                          range: selectedItem?.range || '',
                          title: selectedPeriod,
                        });
                      }}
                    >
                      {MatomoPeriods.map(matomoPeriodAndRange => (
                        <MenuItem value={matomoPeriodAndRange.title}>
                          {matomoPeriodAndRange.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </Typography>
              <Divider style={{ margin: '0.5rem' }} />
              <Grid container>
                <LineChart
                  width={700}
                  height={400}
                  series={[
                    {
                      data: lineChartLabels.yLabels,
                      label: 'UXE Docsbot User Visits Trend',
                    },
                  ]}
                  xAxis={[
                    { scaleType: 'point', data: lineChartLabels.xLabels },
                  ]}
                  colors={RedHatStandardColors}
                  loading={loadingInsights}
                  margin={{ left: 80, right: 80 }}
                />
              </Grid>
            </InfoCard>
          </div>
        </div>
      )}
    </div>
  );
}

export default Docsbot;
