import React, { useEffect, useState } from 'react';
import {
  Content,
  Header,
  HeaderLabel,
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
} from '@material-ui/core';
import { StatsCard } from '../Generic/StatsCard';
import { useApi } from '@backstage/core-plugin-api';
import { spashipApiRef } from '../../api';
import pluginDiscoveryData from './PluginDiscovery.json';
import { DataStream, PluginAnalytics, PluginStats } from '../../Interfaces';
import { MatomoPeriod, MatomoRange } from '../Generic/Constants';

export const PulseDashboard = () => {
  const matomo = useApi(spashipApiRef);
  const [pluginsVisitData, setPluginsVisitData] = useState<PluginStats[]>();
  const [loadingPluginStats, setLoadingPluginStats] = useState(false);
  const [pulseDataStreams, setPulseDataStreams] = useState<DataStream[]>();
  const [periodOrRange, setPeriodOrRange] = useState({
    period: 'day',
    range: 'last10',
  });
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
      const statsByPageLabels = await matomo.getMatomoPageUrls(
        periodOrRange.period,
        periodOrRange.range,
      );
      let statsByPlugin: any = {};
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

      const formattedStatsByPlugin = Object.keys(statsByPlugin).map(key => {
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
              value: statsByPageLabels.reportTotal.nb_uniq_visitors || 'N/A',
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

      setPluginsVisitData(formattedStatsByPlugin);
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
      <Header title="Pulse Dashboard" subtitle="Pulse Analytics Dashboard">
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
                value={periodOrRange.period}
                onChange={evt => {
                  const period: any = evt.target.value;
                  setPeriodOrRange({ ...periodOrRange, period: period });
                }}
              >
                {MatomoPeriod.map(period => (
                  <MenuItem value={period.value}>{period.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div>
            <FormControl variant="outlined" size="small">
              <InputLabel id="range">Range</InputLabel>
              <Select
                label="range"
                labelId="range"
                value={periodOrRange.range}
                onChange={evt => {
                  const range: any = evt.target.value;
                  setPeriodOrRange({ ...periodOrRange, range: range });
                }}
              >
                {MatomoRange.map(range => (
                  <MenuItem
                    value={range.value}
                  >{`${range.title} ${periodOrRange.period}s`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
        {loadingPluginStats && <LinearProgress />}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ width: '50%' }}>
            {pulseDataStreams &&
              pulseDataStreams.map(dataStream => {
                return <StatsCard width="100%" dataStream={dataStream} />;
              })}
          </div>
          <div style={{ width: '50%' }}>
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
                  />
                </TableContainer>
              </Card>
            ) : (
              ''
            )}
          </div>
        </div>
      </Content>
    </Page>
  );
};
