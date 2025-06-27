import { useEffect, useState } from 'react';
import {
  Content,
  Header,
  HeaderLabel,
  InfoCard,
  Page,
  Table,
  TableColumn,
} from '@backstage/core-components';
import {
  Paper,
  TableContainer,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Grid,
  Typography,
  Divider,
  useTheme,
} from '@material-ui/core';
import { StatsCard } from '../Generic/StatsCard';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { devexApiRef } from '../../api';
import pluginDiscoveryData from './PluginDiscovery.json';
import {
  DataStream,
  PieChartData,
  PluginAnalytics,
  PluginStats,
} from '../../Interfaces';
import { MatomoPeriods, RedHatStandardColors } from '../Generic/Constants';
import { getPluginInterpolationChart } from './PrepareVisualData';
import { BarChart, LineChart } from '@mui/x-charts';
import useStyles from './Pulse.styles';

export const PulseDashboard = () => {
  const matomo = useApi(devexApiRef);
  const config = useApi(configApiRef);

  const [pluginsVisitData, setPluginsVisitData] = useState<PluginStats[]>();
  const [loadingPluginStats, setLoadingPluginStats] = useState(false);
  const [pulseDataStreams, setPulseDataStreams] = useState<DataStream[]>();
  const [lineChartData, setLineChartData] = useState<any>();
  const [lineChartXLabels, setLineChartXLabels] = useState<any>();
  const [pieChartData, setPieChartData] = useState<any>();
  const [periodOrRange, setPeriodOrRange] = useState(MatomoPeriods[0]);
  const theme: any = useTheme();
  const classes = useStyles(theme);

  const columns: TableColumn[] = [
    {
      title: 'Name',
      field: 'name',
    },
    {
      title: 'Visits',
      field: 'visits',
    },
  ];

  const getStatsByPlugin = async () => {
    try {
      setPulseDataStreams([]);
      setLoadingPluginStats(true);
      const siteId = config.getString('app.analytics.matomo.siteId');
      const statsByPageLabels = await matomo.getMatomoPageUrls(
        periodOrRange.period,
        periodOrRange.range,
        siteId,
      );
      let statsByPlugin: { [key: string]: number } = {};
      pluginDiscoveryData.data.forEach(plugin => {
        if (plugin.lifecycle === 'production' && plugin.viewUrl) {
          Object.keys(statsByPageLabels?.reportData).forEach(
            (period: string) => {
              if (statsByPageLabels.reportData[period].length) {
                statsByPageLabels.reportData[period].forEach(
                  (stats: PluginAnalytics) => {
                    if (stats?.label.includes(plugin.viewUrl)) {
                      const previousCount = statsByPlugin[plugin.title] || 0;
                      statsByPlugin = {
                        ...statsByPlugin,
                        [plugin.title]: previousCount + stats.nb_visits,
                      };
                    }
                  },
                );
              }
            },
          );
        }
      });

      const formattedStatsByPlugin: PluginStats[] = Object.keys(
        statsByPlugin,
      ).map(key => {
        return { name: key, visits: statsByPlugin[key] };
      });

      setPulseDataStreams([
        {
          workStream: 'User Reach & Engagement',
          dataPoints: [
            {
              name: 'Total visits',
              value: statsByPageLabels.reportTotal.nb_visits || 'N/A',
            },
            {
              name: 'Unique User visits',
              value:
                statsByPageLabels.reportTotal?.sum_daily_nb_uniq_visitors ||
                statsByPageLabels.reportTotal?.nb_uniq_visitors ||
                'N/A',
            },
          ],
        },
        {
          workStream: 'Plugins',
          sourceUrl: '/plugins',
          dataPoints: [
            {
              name: 'User visits',
              value:
                Object.keys(statsByPlugin).reduce(
                  (count: number, key: string) => {
                    return count + statsByPlugin[key];
                  },
                  0,
                ) || 0,
            },
            {
              name: 'Plugins developed / installed',
              value: pluginDiscoveryData.data.reduce(
                (count: number, data: any) => {
                  if (data.lifecycle === 'production' && data.viewUrl)
                    return count + 1;
                  return count;
                },
                0,
              ),
            },
          ],
        },
      ]);
      if (formattedStatsByPlugin.length > 1) {
        formattedStatsByPlugin.sort(
          (dataA: PluginStats, dataB: PluginStats) =>
            dataB.visits - dataA.visits,
        );
      }
      setPluginsVisitData(formattedStatsByPlugin);

      const pieChartFormattedData: PieChartData[] = [];
      formattedStatsByPlugin.forEach((plugin: any) => {
        pieChartFormattedData.push({
          id: plugin.name,
          value: plugin.visits,
          label: plugin.name,
        });
      });

      setPieChartData(pieChartFormattedData);
      const chartData = getPluginInterpolationChart(
        statsByPageLabels?.reportData,
      );
      setLineChartData(chartData?.data || []);
      setLineChartXLabels(chartData?.xLabels || []);
      setLoadingPluginStats(false);
    } catch (_err) {
      setLoadingPluginStats(false);
    }
  };

  useEffect(() => {
    getStatsByPlugin();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodOrRange]);
  return (
    <Page themeId="tool">
      <Header title="Compass Dashboard" subtitle="Compass Analytics Dashboard">
        <HeaderLabel label="Owner" value="Team DevEx" />
      </Header>
      <Content>
        <div
          style={{
            display: 'flex',
            justifyContent: 'end',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
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
        </div>
        {loadingPluginStats && <LinearProgress />}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            {!loadingPluginStats && pulseDataStreams && (
              <StatsCard width="100%" dataStream={pulseDataStreams[0]} />
            )}
            {!loadingPluginStats && pulseDataStreams && (
              <StatsCard width="100%" dataStream={pulseDataStreams[1]} />
            )}
            {!loadingPluginStats && pluginsVisitData ? (
              <Card>
                <TableContainer component={Paper}>
                  <Table
                    options={{
                      searchFieldVariant: 'outlined',
                      pageSize: 10,
                      emptyRowsWhenPaging: false,
                      grouping: false,
                      draggable: false,
                    }}
                    title="All Plugins"
                    data={pluginsVisitData}
                    columns={columns}
                    style={{ minHeight: '32rem' }}
                  />
                </TableContainer>
              </Card>
            ) : (
              ''
            )}
          </Grid>
          <Grid item xs={6}>
            {!loadingPluginStats && pluginsVisitData ? (
              <div style={{ marginBottom: '1rem' }}>
                <InfoCard className={classes.chart}>
                  <Typography variant="h5">Plugins visits Trend</Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Grid container>
                    <LineChart
                      height={350}
                      series={lineChartData}
                      xAxis={[
                        {
                          scaleType: 'point',
                          data: lineChartXLabels?.map(
                            (label: string) => label.split(',')[0],
                          ),
                          tickSize: 0.5,
                          tickLabelStyle: { fontSize: 10 },
                        },
                      ]}
                      slotProps={{
                        legend: {
                          position: { vertical: 'bottom', horizontal: 'middle' },
                        },
                      }}
                      margin={{ left: 60, bottom: 120 }}
                      colors={RedHatStandardColors}
                    />
                  </Grid>
                </InfoCard>
                <InfoCard className={classes.chart}>
                  <Typography variant="h5">
                    Contributions on visits per plugin
                  </Typography>
                  <Divider style={{ margin: '0.5rem' }} />
                  <Grid container>
                    <BarChart
                      dataset={pieChartData}
                      yAxis={[{ scaleType: 'band', dataKey: 'label' }]}
                      xAxis={[{ label: 'Total Visits' }]}
                      series={[
                        {
                          dataKey: 'value',
                          color: '#0066cc',
                        },
                      ]}
                      layout="horizontal"
                      height={350}
                      margin={{ left: 150 }}
                    />
                  </Grid>
                </InfoCard>
              </div>
            ) : (
              ''
            )}
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
