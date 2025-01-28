import { LinkButton } from '@backstage/core-components';
import { Card, LinearProgress, useTheme } from '@material-ui/core';
import React from 'react';
import useStyles from '../DashboardComponent/Dashboard.styles';

interface IProps {
  loadingInProgress?: boolean;
  dataStream: any;
  width: string;
}

export const StatsCard = (props: IProps) => {
  const theme: any = useTheme();
  const classes = useStyles(theme);

  return (
    <Card
      className={classes.content}
      style={{ marginBottom: '1rem', width: props.width }}
    >
      {props.loadingInProgress && !props.dataStream ? (
        <LinearProgress />
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '1rem',
          }}
        >
          <div className={classes.pluginTitle}>
            {props.dataStream?.workStream}
          </div>
          <div style={{ display: 'flex' }}>
            {props.dataStream?.sourceUrl ? (
              <div>
                <LinkButton
                  variant="contained"
                  color="primary"
                  to={props.dataStream.sourceUrl}
                  target="_blank"
                >
                  Visit {props.dataStream.workStream}
                </LinkButton>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {props?.dataStream?.dataPoints.map((dataPoint: any) => (
          <Card className={classes.content}>
            <div className={classes.value}>{dataPoint.value}</div>
            <div className={classes.dataPointName}>{dataPoint.name}</div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
