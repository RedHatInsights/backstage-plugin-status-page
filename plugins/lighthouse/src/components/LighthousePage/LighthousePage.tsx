/* eslint-disable no-nested-ternary */
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import {
  InfoCard,
  MissingAnnotationEmptyState,
} from '@backstage/core-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Tooltip as MuiTooltip,
  Chip,
  Avatar,
  Container,
  FormHelperText,
  useTheme,
} from '@material-ui/core';
import LhBranchIcon from '@material-ui/icons/CallSplit';
import { Table, TableColumn } from '@backstage/core-components';
import { TLhProjectBuild } from '../../api/types';
import { PieChart, Pie, Cell, Label } from 'recharts';

import { configApiRef, useApi } from '@backstage/core-plugin-api';
import Assessment from '@material-ui/icons/Assessment';
import ContactMail from '@material-ui/icons/ContactMail';
import useAsync from 'react-use/lib/useAsync';
import { lighthouseApiRef } from '../../api';

const Center = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    {children}
  </div>
);

const EmptyState = () => (
  <Typography variant="h1" component="div" style={{ textAlign: 'center' }}>
    N/A
  </Typography>
);

const getLighthouseConfig = (entity: Entity) => {
  const projectName =
    entity.metadata.annotations?.['lighthouse.io/project-name'] || '';
  return projectName.toLocaleLowerCase().split(' ').join('-');
};

const buildTableCols: TableColumn<TLhProjectBuild>[] = [
  {
    title: 'Hash',
    field: 'hash',
    render: data => (
      <Chip
        avatar={<Avatar alt={data.author} src={data.avatarUrl} />}
        label={data.hash}
        size="small"
      />
    ),
  },
  {
    title: 'Message',
    field: 'commitMessage',
  },
  {
    title: 'Branch',
    field: 'branch',
    render: data => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <LhBranchIcon />
        <div style={{ marginLeft: '0.5rem' }}>{data.branch}</div>
      </div>
    ),
  },
  {
    title: 'Run At',
    field: 'runAt',
    type: 'datetime',
  },
];

const scoreFormatLabel = {
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
  performance: 'Performance',
  seo: 'SEO',
};

export const LighthouseHomePage = () => {
  const [selectedUrl, setSelectedUrl] = useState('');
  const [selectedBuildId, setSelectedBuildId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const theme = useTheme();
  const isDarkMode = theme.palette.type === 'dark';

  const { entity } = useEntity();
  const config = useApi(configApiRef);
  const lighthouseApi = useApi(lighthouseApiRef);
  const lhProjectSlug = getLighthouseConfig(entity);

  const lighthouseContact = config.getOptionalString('lighthouse.contact_us');
  const lighthouseInstanceUrl = config.getOptionalString(
    'lighthouse.instance_url',
  );
  const isLhConfigured = Boolean(lhProjectSlug);

  const computeColor = useCallback((score: number) => {
    if (score >= 0 && score <= 49) {
      return '#ee0000';
    } else if (score >= 50 && score <= 89) {
      return '#f0ab00';
    }
    return '#3e8635';
  }, []);

  const { loading: isProjectDetailsLoading, value: projectDetails } =
    useAsync(async () => {
      if (lhProjectSlug) {
        return await lighthouseApi.getProjects(lhProjectSlug);
      }
      return undefined;
    }, [lhProjectSlug]);

  const { loading: isProjectBuildsLoading, value: projectBuilds } =
    useAsync(async () => {
      if (projectDetails?.id) {
        const data = await lighthouseApi.getProjectBuilds(projectDetails.id);
        setSelectedBuildId(data?.[0]?.id);
        setSelectedBranch(data?.[0]?.branch);
        return data;
      }
      return undefined;
    }, [projectDetails?.id]);

  const { loading: isBranchesLoading, value: branches } = useAsync(async () => {
    if (projectDetails?.id) {
      return await lighthouseApi.getProjectBranches(projectDetails.id);
    }
    return undefined;
  }, [projectDetails?.id]);

  const { loading: isUrlsLoading, value: projectBuildUrls } =
    useAsync(async () => {
      if (projectDetails?.id && selectedBuildId) {
        const data = await lighthouseApi.getProjectBuildUrls(
          projectDetails.id,
          selectedBuildId,
        );
        setSelectedUrl(data?.[0]?.url);
        return data;
      }
      return undefined;
    }, [projectDetails?.id, selectedBuildId]);

  const { loading: isProjectRunLoading, value: projectBuildRun } =
    useAsync(async () => {
      if (projectDetails?.id && selectedBuildId && selectedUrl) {
        return await lighthouseApi.getProjectBuildRun(
          projectDetails.id,
          selectedBuildId,
          selectedUrl,
        );
      }
      return undefined;
    }, [projectDetails?.id, selectedBuildId, selectedUrl]);

  useEffect(() => {
    const newBuild = projectBuilds?.filter(
      ({ branch }) => selectedBranch === branch,
    );
    if (newBuild?.[0]?.id) setSelectedBuildId(newBuild[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  if (!isLhConfigured) {
    return (
      <MissingAnnotationEmptyState annotation="lighthouse.io/project-name" />
    );
  }

  if (isProjectDetailsLoading) {
    return (
      <Container style={{ padding: '3rem' }}>
        <Center>
          <CircularProgress size={32} />
        </Center>
      </Container>
    );
  }

  return (
    <Container style={{ display: 'flex', flexDirection: 'column' }}>
      <InfoCard>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" component="div">
              {projectDetails?.name}
            </Typography>
            <Typography
              variant="h6"
              component="div"
              style={{ fontSize: '0.8rem' }}
            >
              slug: {projectDetails?.slug}
            </Typography>
          </Box>
          <Box>
            <Grid container spacing={2}>
              {Boolean(lighthouseContact) && (
                <Grid item>
                  <MuiTooltip title="Contact Us">
                    <a target="_blank" rel="noopener" href={lighthouseContact}>
                      <ContactMail fontSize="large" />
                    </a>
                  </MuiTooltip>
                </Grid>
              )}
              {Boolean(lighthouseInstanceUrl) && (
                <Grid item>
                  <MuiTooltip title="Lighthouse Instance">
                    <a
                      target="_blank"
                      rel="noopener"
                      href={new URL(
                        `/app/projects/${
                          projectDetails?.slug
                        }/dashboard?branch=${selectedBranch}&runUrl=${encodeURIComponent(
                          selectedUrl,
                        )}`,
                        lighthouseInstanceUrl,
                      ).toString()}
                    >
                      <Assessment fontSize="large" />
                    </a>
                  </MuiTooltip>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </InfoCard>
      <Grid container spacing={4} style={{ marginTop: '0.5rem' }}>
        <Grid item xs={12}>
          <Table
            title={`${projectDetails?.name} Builds`}
            data={projectBuilds || []}
            isLoading={isProjectBuildsLoading}
            columns={buildTableCols}
            options={{
              padding: 'dense',
              rowStyle: rowData => ({
                backgroundColor:
                  selectedBuildId === rowData.tableData.id
                    ? isDarkMode
                      ? '#333'
                      : '#EEE'
                    : 'inherit',
              }),
              emptyRowsWhenPaging: false,
            }}
            onRowClick={(_, rowData) => {
              if (rowData) {
                setSelectedBuildId(rowData.id);
                setSelectedBranch(rowData.branch);
              }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <InfoCard title="Score Card">
            <Grid container spacing={2} style={{ marginBottom: '1rem' }}>
              <Grid item xs={12} md={8}>
                <FormControl
                  variant="outlined"
                  size="small"
                  style={{ width: '100%' }}
                >
                  <InputLabel id="urls">URLs</InputLabel>
                  <Select
                    labelId="urls"
                    label="URL"
                    disabled={isUrlsLoading}
                    value={selectedUrl}
                    onChange={evt => setSelectedUrl(evt.target.value as string)}
                  >
                    {projectBuildUrls?.map(({ url }) => (
                      <MenuItem value={url}>{url}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Select a URL to find score for a particular page in the
                    build
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl
                  variant="outlined"
                  size="small"
                  style={{ width: '100%' }}
                >
                  <InputLabel id="branches">Branches</InputLabel>
                  <Select
                    labelId="branches"
                    label="Branch"
                    disabled={isBranchesLoading}
                    value={selectedBranch}
                    onChange={evt =>
                      setSelectedBranch(evt.target.value as string)
                    }
                  >
                    {branches?.map(({ branch }) => (
                      <MenuItem value={branch}>{branch}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Toggling branch will switch to the latest build for that
                    branch.
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            {isProjectRunLoading && (
              <div style={{ padding: '1rem', paddingBottom: '2rem' }}>
                <Center>
                  <CircularProgress size={32} />
                </Center>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                paddingBottom: '1rem',
              }}
            >
              {!isProjectRunLoading && !selectedBuildId && <EmptyState />}
              {!isProjectRunLoading &&
                Boolean(selectedBuildId) &&
                Object.keys(projectBuildRun || {}).map(cat => (
                  <div
                    key={cat}
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    <PieChart width={150} height={150}>
                      <Pie
                        data={[
                          {
                            value: 'score',
                            score: projectBuildRun?.[cat],
                          },
                          {
                            value: 'total',
                            score: 100 - (projectBuildRun?.[cat] || 0),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={50}
                        outerRadius={60}
                        dataKey="score"
                        nameKey="value"
                      >
                        <Label
                          value={projectBuildRun?.[cat]}
                          position="center"
                          style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                        />
                        <Cell
                          fill={computeColor(projectBuildRun?.[cat] || 0)}
                          stroke={computeColor(projectBuildRun?.[cat] || 0)}
                        />
                        <Cell
                          fill={isDarkMode ? '#333' : '#eee'}
                          stroke={isDarkMode ? '#333' : '#eee'}
                        />
                      </Pie>
                    </PieChart>
                    <Typography
                      variant="h6"
                      align="center"
                      style={{ marginTop: '0.25rem', fontSize: '14px' }}
                    >
                      {scoreFormatLabel[cat as keyof typeof scoreFormatLabel]}
                    </Typography>
                  </div>
                ))}
            </div>
          </InfoCard>
        </Grid>
      </Grid>
    </Container>
  );
};

const queryClient = new QueryClient();

export const LighthousePage = () => (
  <QueryClientProvider client={queryClient}>
    <LighthouseHomePage />
  </QueryClientProvider>
);
