import React, { useEffect, useState } from 'react';
import { Grid } from '@material-ui/core';
import { PieChart } from '@mui/x-charts/PieChart';
import { Loader } from '../utils';

interface IProps {
  data: { supportWorkStoryPoints: number; newWorkStoryPoints: number };
  mode: string;
  loading: boolean;
}

interface IChartData {
  label: string;
  value: number;
  color: string;
}

export const NewAndSupportWorkChart = (props: IProps) => {
  const [data, setData] = useState<IChartData[] | any>();

  useEffect(() => {
    setData([
      {
        label: `New Work (${props.data.newWorkStoryPoints} pts)`,
        value: props.data.newWorkStoryPoints,
        total:
          props.data.newWorkStoryPoints + props.data.supportWorkStoryPoints,
        color: '#0066cc',
      },
      {
        label: `Support Work (${props.data.supportWorkStoryPoints} pts)`,
        value: props.data.supportWorkStoryPoints,
        total:
          props.data.newWorkStoryPoints + props.data.supportWorkStoryPoints,
        color: '#92c5f9',
      },
    ]);
  }, [props.data]);

  return (
    <>
      <Grid
        container
        spacing={1}
        style={{ textAlign: 'left', padding: 'auto', height: '18.3rem' }}
      >
        {props.loading || !props.data || !data ? (
          <div style={{ height: '100%', width: '100%', padding: '1rem' }}>
            <Loader message="Fetching data from JIRA" />
          </div>
        ) : (
          <Grid item xs={12} style={{ margin: 'auto' }}>
            <PieChart
              series={[
                {
                  arcLabel: (item: any) =>
                    `${Math.round((item.value / item.total) * 100)}%`,
                  startAngle: -90,
                  endAngle: 90,
                  data,
                },
              ]}
              height={200}
              width={430}
              slotProps={{
                legend: {
                  position: { horizontal: 'middle', vertical: 'bottom' },
                  direction: 'column',
                },
              }}
              margin={{ bottom: -50 }}
            />
            <div
              style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
              }}
            >
              Total:{' '}
              {props.data.newWorkStoryPoints +
                props.data.supportWorkStoryPoints}{' '}
              Points
            </div>
          </Grid>
        )}
      </Grid>
    </>
  );
};
