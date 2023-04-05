import React, { useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { MissingAnnotationEmptyState } from '@backstage/core-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  useGetUserActionByPageURL,
  useGetUserDeviceMetrics,
  useGetUserActionMetrics,
  useGetUserGeoMetrics,
  useGetUserVisitSummary,
  useGetUserVisitByTime,
} from '../../hooks';

const visitColumns: TableColumn[] = [
  {
    title: 'Type',
    field: 'metric',
  },
  {
    title: 'Value',
    field: 'value',
  },
];

const geoColumns: TableColumn[] = [
  {
    title: 'Country',
    field: 'label',
  },
  {
    title: 'Avg. Site Time',
    field: 'avg_time_on_site',
  },
  {
    title: 'Bounce Rate',
    field: 'bounce_rate',
  },
  {
    title: 'Actions',
    field: 'nb_actions',
  },
  {
    title: 'Actions/Visit',
    field: 'nb_actions_per_visit',
  },
  {
    title: 'Visitors',
    field: 'nb_visits',
  },
  {
    title: 'Unique Visitors',
    field: 'nb_uniq_visitors',
  },
];

const getMatomoConfig = (entity: Entity) =>
  entity.metadata.annotations?.['matomo.io/site-id'];

export const MatomoHomePage = () => {
  const [period, setPeriod] = useState('day');
  const [range, setRange] = useState('today');
  const [lineGraphRange, setLineGraphRange] = useState('last10');

  const { entity } = useEntity();
  const matomoSiteId = getMatomoConfig(entity);
  const isMatomoConfigured = Boolean(matomoSiteId);

  // visitor data
  const { data: visitSummary } = useGetUserVisitSummary(
    matomoSiteId,
    period,
    range,
  );
  const { data: visitByTime } = useGetUserVisitByTime(
    matomoSiteId,
    period,
    lineGraphRange,
  );

  const { data: geoMetrics, isLoading: isGeoMetricsLoading } =
    useGetUserGeoMetrics(matomoSiteId, period, range);
  const { data: deviceMetrics, isLoading: isDeviceMetricsLoading } =
    useGetUserDeviceMetrics(matomoSiteId, period, range);
  const { data: actionMetrics, isLoading: isActionMetricsLoading } =
    useGetUserActionMetrics(matomoSiteId, period, range);
  const { data: actionByPageURL } = useGetUserActionByPageURL(
    matomoSiteId,
    period,
    range,
  );

  const visitPieChart = [
    { name: 'visitors', value: visitSummary?.reportData?.nb_visits },
    {
      name: 'unique visitors',
      value: visitSummary?.reportData?.nb_uniq_visitors,
    },
  ];

  if (!isMatomoConfigured) {
    return <MissingAnnotationEmptyState annotation="matomo.io/site-id" />;
  }

  return (
    <Container>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'end',
          marginBottom: '1rem',
        }}
      >
        <div style={{ marginRight: '1rem' }}>
          <FormControl variant="outlined" size="small">
            <InputLabel id="period">Period</InputLabel>
            <Select
              labelId="period"
              label="period"
              value={period}
              onChange={evt => setPeriod(evt.target.value as string)}
            >
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div>
          <FormControl variant="outlined" size="small">
            <InputLabel id="range">Date</InputLabel>
            <Select
              label="range"
              labelId="range"
              value={range}
              onChange={evt => setRange(evt.target.value as string)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="lastWeek">Last Week</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="lastYear">Last Year</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Visit Summary
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visitPieChart}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                  >
                    <Cell fill="#0277bd" />
                    <Cell fill="#ff8f00" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h5" component="div">
                  Visits Over Time
                </Typography>
                <div>
                  <FormControl variant="outlined" size="small">
                    <InputLabel id="line-range">Range</InputLabel>
                    <Select
                      label="range"
                      labelId="line-range"
                      value={lineGraphRange}
                      onChange={evt =>
                        setLineGraphRange(evt.target.value as string)
                      }
                    >
                      <MenuItem value="last10">Last 10</MenuItem>
                      <MenuItem value="last20">Last 20</MenuItem>
                      <MenuItem value="last30">Last 30</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={visitByTime}
                  margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                >
                  <Line type="monotone" dataKey="visitors" stroke="#0277bd" />
                  <Line
                    type="monotone"
                    dataKey="uniqVisitors"
                    stroke="#ff8f00"
                    name="unique visitors"
                  />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <Tooltip />
                  <Legend />
                  <XAxis dataKey="name" />
                  <YAxis />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card style={{ height: '300px' }}>
            <CardContent>
              <Typography
                style={{ paddingTop: '4rem', textAlign: 'center' }}
                variant="h5"
                component="div"
              >
                Avg Time On Site
              </Typography>
              <Typography
                variant="h1"
                component="div"
                style={{ textAlign: 'center' }}
              >
                {visitSummary?.reportData?.avg_time_on_site}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card style={{ height: '300px' }}>
            <CardContent>
              <Typography
                style={{ paddingTop: '4rem', textAlign: 'center' }}
                variant="h5"
                component="div"
              >
                Bounce Rate
              </Typography>
              <Typography
                variant="h1"
                component="div"
                style={{ textAlign: 'center' }}
              >
                {visitSummary?.reportData?.bounce_rate}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card style={{ height: '300px' }}>
            <CardContent>
              <Typography
                style={{ paddingTop: '4rem', textAlign: 'center' }}
                variant="h5"
                component="div"
              >
                Actions/Visit
              </Typography>
              <Typography
                variant="h1"
                component="div"
                style={{ textAlign: 'center' }}
              >
                {visitSummary?.reportData?.nb_actions_per_visit}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={4}>
            <Table
              options={{ paging: false, search: false }}
              columns={visitColumns}
              title="User Action Overview"
              isLoading={isActionMetricsLoading}
              data={actionMetrics || []}
            />
          </Grid>
          <Grid container item xs={8}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Visit By Page URL
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={actionByPageURL?.reportData}
                      margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                    >
                      <Line
                        type="monotone"
                        dataKey="nb_visits"
                        name="Visits"
                        stroke="#0277bd"
                      />
                      <Line
                        type="monotone"
                        dataKey="nb_hits"
                        stroke="#ff8f00"
                        name="Page Hits"
                      />
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <Tooltip />
                      <Legend />
                      <XAxis dataKey="label" />
                      <YAxis />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Time By Page URL
                  </Typography>
                  <ResponsiveContainer width="100%" height={210}>
                    <LineChart
                      data={actionByPageURL?.reportData}
                      margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                    >
                      <Line
                        type="monotone"
                        dataKey="avg_time_on_page"
                        name="Avg. Page Time"
                        stroke="#0277bd"
                      />
                      <Line
                        type="monotone"
                        dataKey="bounce_rate"
                        stroke="#ff8f00"
                        name="Bounce Rate"
                      />
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <Tooltip />
                      <Legend />
                      <XAxis dataKey="label" />
                      <YAxis />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Table
            options={{ paging: false, search: false }}
            columns={geoColumns}
            title="Visit Geography Overview"
            isLoading={isGeoMetricsLoading}
            data={geoMetrics?.reportData || []}
          />
        </Grid>
        <Grid item xs={12}>
          <Table
            options={{ paging: false, search: false }}
            columns={geoColumns}
            title="Visit Device Overview"
            isLoading={isDeviceMetricsLoading}
            data={deviceMetrics?.reportData || []}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

const queryClient = new QueryClient();

export const MatomoPage = () => (
  <QueryClientProvider client={queryClient}>
    <MatomoHomePage />
  </QueryClientProvider>
);
