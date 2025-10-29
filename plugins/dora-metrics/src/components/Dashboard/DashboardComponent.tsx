import { Header, Page, Content, HeaderLabel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { doraGitlabApiRef } from '../../api/gitlab';
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@material-ui/core';
import { doraJiraApiRef } from '../../api/jira';
import { useEffect, useState } from 'react';
import {
  DeploymentFrequency,
  IssuesTable,
  LeadTimeChangeChart,
  MRLeadTimeChangeChart,
  MRTable,
} from './index';
import { DATE_RANGE, PROJECTS } from '../../constants';

export const DashboardComponent = () => {
  const [totalProdDeployments, setTotalProdDeployments] = useState<number>(0);
  const [prodDeployments, setProdDeployments] = useState<any>([]);
  const [totalClosedIssues, setTotalClosedIssues] = useState<number>(0);
  const [leadTimeChange, setLeadTimeChange] = useState<
    { jiraCreatedOn: string; jiraResolution: string; jiraNumber: string }[]
  >([]);
  const [mrLeadTimeChange, setMrLeadTimeChange] = useState<
    { mrCreatedOn: string; mrMergedOn: string; mrId: string }[]
  >([]);
  const [averageLeadTime, setAverageLeadTime] = useState<number>(0);
  const [project, setProject] = useState<string>('XE Compass');
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(false);
  const [closedIssues, setClosedIssues] = useState<any>([]);
  const [closedMRs, setClosedMRs] = useState<any>([]);
  const gitlabApi = useApi(doraGitlabApiRef);
  const jiraApi = useApi(doraJiraApiRef);

  const regex = /[A-Z]+-\d+/g;
  const getDetails = async () => {
    try {
      setLoading(true);
      const projectId =
        PROJECTS.find(item => item.name === project)?.projectId || '66262';
      const prodDeployment = PROJECTS.find(item => item.name === project) || {
        environment: 'production',
      };
      await gitlabApi
        .getDeployments(projectId, prodDeployment.environment)
        .then(deployments => {
          if (deployments && deployments.length > 0) {
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - dateRange);
            setProdDeployments(deployments);
            setTotalProdDeployments(deployments?.length);
          }
        })
        .catch(_error => {
          setTotalProdDeployments(0);
        });

      const resposne = await gitlabApi.getMergeRequests(projectId, dateRange);
      const jiraNumbers: string[] = [];
      const mrLeadTimeChangeData: {
        mrCreatedOn: string;
        mrMergedOn: string;
        mrId: string;
      }[] = [];
      if (resposne && resposne.length > 0) {
        setClosedMRs(resposne);
        resposne.forEach(async (item: any) => {
          const jiraNumberFromTitle = item.title.match(regex);
          const jiraNumberFromDescription = item.description.match(regex);
          if (jiraNumberFromTitle) {
            if(!jiraNumbers.includes(jiraNumberFromTitle[0])) {
              jiraNumbers.push(jiraNumberFromTitle[0]);
            }
          }
          if (jiraNumberFromDescription) {
            if(!jiraNumbers.includes(jiraNumberFromDescription[0]))
              jiraNumbers.push(jiraNumberFromDescription[0]);
          }

          mrLeadTimeChangeData.push({
            mrCreatedOn: item.created_at,
            mrMergedOn: item.merged_at,
            mrId: `#${item.id}`,
          });
        });
      }

      let closedIssuesCount = 0;
      const leadTimeChangeData = [];
      const closedIssuesData = [];
      let totalLeadTime = 0;
      for (const jiraNumber of jiraNumbers) {
        const jiraDetails = await jiraApi.getJiraDetails(jiraNumber);
        if (jiraDetails) {
          if (jiraDetails.fields.status.name === 'Closed') {
            closedIssuesData.push(jiraDetails);
            leadTimeChangeData.push({
              jiraCreatedOn: jiraDetails.fields.created,
              jiraResolution: jiraDetails.fields.resolutiondate,
              jiraNumber: jiraNumber,
            });
            closedIssuesCount++;
            const timeInMs =
              new Date(jiraDetails.fields.resolutiondate).getTime() -
              new Date(jiraDetails.fields.created).getTime();
            const timeInDays = Math.round(timeInMs / (1000 * 60 * 60 * 24));
            totalLeadTime += timeInDays;
          }
        }
      }
      setLeadTimeChange(leadTimeChangeData);
      setMrLeadTimeChange(mrLeadTimeChangeData);
      setTotalClosedIssues(closedIssuesCount);
      setClosedIssues(closedIssuesData);
      setAverageLeadTime(Math.round(totalLeadTime / closedIssuesCount));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, dateRange]);

  return (
    <Page themeId="tool">
      <Header title="DORA Metrics" subtitle="DORA Metrics">
        <HeaderLabel label="Owner" value="AppDev" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div>
            <Button
              onClick={() => gitlabApi.getMergeRequests(project, dateRange)}
            >
              Get Merge Requests
            </Button>
            <Button onClick={() => getDetails()}>Get Jira Details</Button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem'}}>
            <TextField
              label="Project"
              variant="outlined"
              fullWidth
              required
              select
              value={project}
              onChange={e => setProject(e.target.value)}
              style={{ width: 'auto' }}
            >
              <MenuItem value="none">Select Project</MenuItem>
              {PROJECTS.map(item => (
                <MenuItem key={item.name} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date Range"
              variant="outlined"
              fullWidth
              required
              select
              value={dateRange}
              onChange={e => setDateRange(parseInt(e.target.value, 10))}
              style={{ width: '10rem' }}
            >
              <MenuItem value={0}>Select Range</MenuItem>
              {DATE_RANGE.map(range => (
                <MenuItem key={range.name} value={range.days}>
                  {range.name}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>
        <Grid container spacing={2} style={{ marginTop: '0.5rem' }}>
          <Grid item xs={12}>
            {loading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress size="3rem" />
              </div>
            )}
          </Grid>
        </Grid>
        {!loading && (
          <>
            <Grid container spacing={2} style={{ marginTop: '0.5rem' }}>
              <Grid item xs={6}>
                <Card>
                  <CardContent style={{ padding: '0.2rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ padding: '0.5rem' }}>
                        <Typography variant="h5">Deployments</Typography>
                        Total Production Deployments: {totalProdDeployments}
                      </div>
                      <div>
                        <DeploymentFrequency deployments={prodDeployments} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h5">Jira Issues</Typography>
                    Total Closed Issues: {totalClosedIssues}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card>
                  <CardContent style={{ padding: '1rem' }}>
                    <Typography variant="h5">
                      Average Lead Time For Change
                    </Typography>
                    <div
                      style={{
                        fontSize: '1.2rem',
                        borderBottom: '2px solid blue',
                        width: 'fit-content',
                      }}
                    >
                      {averageLeadTime ? `${averageLeadTime} Days` : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginTop: '1rem',
              }}
            >
              Jira Perspective
            </div>
            <Grid container spacing={2} style={{ marginTop: '0.5rem' }}>
              <Grid item xs={6}>
                <LeadTimeChangeChart leadTimeChange={leadTimeChange} />
              </Grid>
              <Grid item xs={6}>
                <IssuesTable closedIssues={closedIssues} />
              </Grid>
            </Grid>

            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginTop: '1rem',
              }}
            >
              Gitlab Perspective
            </div>
            <Grid container spacing={2} style={{ marginTop: '0.5rem' }}>
              <Grid item xs={6}>
                <MRLeadTimeChangeChart leadTimeChange={mrLeadTimeChange} />
              </Grid>
              <Grid item xs={6}>
                {closedMRs.length > 0 && <MRTable mergerMRs={closedMRs} />}
              </Grid>
            </Grid>
          </>
        )}
      </Content>
    </Page>
  );
};
