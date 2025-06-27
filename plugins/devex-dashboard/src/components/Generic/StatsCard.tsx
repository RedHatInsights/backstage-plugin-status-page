import { InfoCard, LinkButton } from '@backstage/core-components';
import {
  Divider,
  Grid,
  LinearProgress,
  Typography,
  useTheme,
} from '@material-ui/core';
import useStyles from '../DashboardComponent/Dashboard.styles';
import { DataPoint } from '../../Interfaces/AppDev';

interface IProps {
  loadingInProgress?: boolean;
  dataStream: any;
  width: string;
}

export const StatsCard = (props: IProps) => {
  const theme: any = useTheme();
  const classes = useStyles(theme);

  return (
    <InfoCard className={classes.infoCard}>
      {props.loadingInProgress && !props.dataStream ? (
        <LinearProgress />
      ) : (
        <>
          <Typography
            variant="h5"
            className={classes.typoGraphy}
          >
            {props.dataStream?.workStream}
            {props.dataStream?.sourceUrl && (
              <LinkButton
                variant="contained"
                color="primary"
                to={props.dataStream.sourceUrl}
                target="_blank"
              >
                Visit {props.dataStream.workStream}
              </LinkButton>
            )}
          </Typography>
          <Divider style={{ marginBottom: '0.5rem' }} />
        </>
      )}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {props?.dataStream?.dataPoints.map((dataPoint: DataPoint, index: number) => (
          <Grid container spacing={2}>
            <Grid item key={`deployment-times-${index}`}>
              <Typography
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                {dataPoint.name}
              </Typography>
              <Typography style={{ fontSize: '24px' }}>
                {dataPoint.value}
              </Typography>
            </Grid>
          </Grid>
        ))}
      </div>
    </InfoCard>
  );
};
