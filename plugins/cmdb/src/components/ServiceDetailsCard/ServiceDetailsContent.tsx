import React from 'react';
import { Avatar, Chip, Grid, Typography } from '@material-ui/core';
import { ServiceDetailsField } from './ServiceDetailsField';
import { EntityPeekAheadPopover } from '@backstage/plugin-catalog-react';
import { Link, StatusAborted, StatusOK } from '@backstage/core-components';
import { BusinessApplication, ServiceNowUser } from '../../apis';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';

const OperationalStatuses: { [x: string]: string } = {
  '1': 'Operational',
};

export interface ServiceDetailsContentProps {
  details: BusinessApplication;
  owner?: ServiceNowUser;
  delegate?: ServiceNowUser;
}

export const ServiceDetailsContent = ({
  details,
  owner,
  delegate,
}: ServiceDetailsContentProps) => (
  <Grid container spacing={2}>
    <ServiceDetailsField
      label="Application Name"
      gridSizes={{ xs: 12 }}
      value={details.name}
    />

    <ServiceDetailsField label="App Code" gridSizes={{ xs: 4 }}>
      <Chip size="medium" label={details.u_application_id} />
    </ServiceDetailsField>

    <ServiceDetailsField
      label="Service Criticality"
      gridSizes={{ md: 4 }}
      value={details.business_criticality}
    />

    <ServiceDetailsField label="Status" gridSizes={{ xs: 4 }}>
      {OperationalStatuses[details.operational_status] ? (
        <StatusOK>{OperationalStatuses[details.operational_status]}</StatusOK>
      ) : (
        <StatusAborted>Unknown</StatusAborted>
      )}
    </ServiceDetailsField>

    <ServiceDetailsField label="Service Owner" gridSizes={{ xs: 6 }}>
      {!owner ? (
        <Skeleton animation="wave" width="80%" height={32} />
      ) : (
        <EntityPeekAheadPopover entityRef={`user:${owner.user_name}`}>
          <Chip
            variant="outlined"
            label={owner.name}
            avatar={<Avatar alt={owner.name} src="#" />}
          />
        </EntityPeekAheadPopover>
      )}
    </ServiceDetailsField>

    <ServiceDetailsField label="Delegate" gridSizes={{ xs: 6 }}>
      {!delegate ? (
        <Skeleton animation="wave" width="80%" height={32} />
      ) : (
        <EntityPeekAheadPopover entityRef={`user:${delegate.user_name}`}>
          <Chip
            variant="outlined"
            label={delegate.name}
            avatar={<Avatar alt={delegate.name} src="#" />}
          />
        </EntityPeekAheadPopover>
      )}
    </ServiceDetailsField>

    <ServiceDetailsField label="Support Contact Email" gridSizes={{ xs: 12 }}>
      <Link
        to={`mailto:${details.u_support_contact_email}`}
        target="_blank"
        rel="noopener"
      >
        <Typography variant="body1">
          {details.u_support_contact_email}
        </Typography>
      </Link>
    </ServiceDetailsField>
  </Grid>
);
