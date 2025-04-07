import { InfoCard } from '@backstage/core-components';
import { Chip, Divider, Grid, Typography } from '@material-ui/core';
import React from 'react';
import { KeyValue } from '../../Interfaces';

type Props = {
  subgraphsRawData: KeyValue;
};

export function SubgraphsDeveloped(props: Props) {
  return (
    <div style={{ gap: '0.5rem', display: 'flex', marginBottom: '1rem' }}>
      <Grid
        container
        spacing={2}
        style={{ display: 'flex', alignItems: 'stretch' }}
        alignItems="stretch"
      >
        <Grid item xs={2}>
          <InfoCard>
            <div style={{ minHeight: '7rem' }}>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Subgraphs Developed
              </Typography>
              <Divider style={{ marginBottom: '1rem' }} />
              <Typography
                variant="h1"
                style={{ fontSize: '3rem' }}
                align="center"
              >
                {Object.keys(props.subgraphsRawData).length}
              </Typography>
            </div>
          </InfoCard>
        </Grid>
        <Grid item xs={10}>
          <InfoCard>
            <div style={{ minHeight: '7rem' }}>
              <Typography
                variant="h5"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Subgraph Names
              </Typography>
              <Divider style={{ marginBottom: '1rem' }} />
              {Object.values(props.subgraphsRawData).map(
                (value: string, index: number) => {
                  return (
                    <Chip
                      label={value}
                      key={`${index}_subgraph_name_chip_key`}
                      size="small"
                    />
                  );
                },
              )}
            </div>
          </InfoCard>
        </Grid>
      </Grid>
    </div>
  );
}
