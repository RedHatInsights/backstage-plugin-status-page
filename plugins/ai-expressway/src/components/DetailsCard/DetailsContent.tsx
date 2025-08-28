import { Avatar, Chip, Grid } from '@material-ui/core';
import { EntityPeekAheadPopover } from '@backstage/plugin-catalog-react';
import { DEFAULT_NAMESPACE } from '@backstage/catalog-model';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';
import { Link } from '@backstage/core-components';

import { DetailsField } from './DetailsField';

const STATUS_COLORS = {
  DONE: '#14892C',
  RESOLVED: '#14892C',
  CLOSED: '#14892C',
  IN_PROGRESS: '#0052CC',
  ACTIVE: '#0052CC',
  DEVELOPMENT: '#0052CC',
  REVIEW: '#FF8B00',
  TESTING: '#FF8B00',
  QA: '#FF8B00',
  BLOCKED: '#DE350B',
  FAILED: '#DE350B',
  REJECTED: '#DE350B',
  TODO: '#42526E',
  OPEN: '#42526E',
  NEW: '#42526E',
  BACKLOG: '#42526E',
  PENDING: '#FF991F',
  WAITING: '#FF991F',
  HOLD: '#FF991F',
  DEFAULT: '#6B778C',
} as const;

const getStatusColor = (status: string): string => {
  const statusUpper = status.toUpperCase();
  
  if (statusUpper in STATUS_COLORS) {
    return STATUS_COLORS[statusUpper as keyof typeof STATUS_COLORS];
  }
  
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (key !== 'DEFAULT' && statusUpper.includes(key)) {
      return color;
    }
  }
  
  return STATUS_COLORS.DEFAULT;
};

export interface DetailsContentProps {
  id?: string;
  summary?: string;
  phase?: string;
  status?: string;
  tags?: string[];
  ownerName?: string;
  ownerEmail?: string;
  assignee?: string;
  namespace?: string;
}

export const DetailsContent = ({
  id,
  summary,
  phase,
  status,
  tags,
  ownerName,
  ownerEmail,
  namespace,
}: DetailsContentProps) => {
  const getOwnerEntityRef = (): string => {
    let username: string | undefined;
    
    if (ownerEmail) {
      username = ownerEmail.split('@')[0];
    } else if (ownerName?.includes('@')) {
      username = ownerName.split('@')[0];
    } else {
      username = ownerName;
    }
    
    return `user:${namespace ?? DEFAULT_NAMESPACE}/${username}`;
  };

  const renderTags = (): React.ReactNode => {
    if (!tags || tags.length === 0) {
      return <span>No tags</span>;
    }

    return (
      <div>
        {tags.map(tag => (
          <Chip 
            key={tag} 
            size="small" 
            variant="outlined"
            label={tag} 
            style={{ marginRight: 8, marginBottom: 8 }} 
          />
        ))}
      </div>
    );
  };

  const renderOwner = (): React.ReactNode => {
    if (!ownerName) {
      return <Skeleton animation="wave" width="80%" height={32} />;
    }

    return (
      <EntityPeekAheadPopover entityRef={getOwnerEntityRef()}>
        <Chip
          variant="outlined"
          label={ownerName}
          avatar={<Avatar alt={ownerName} src="#" />}
        />
      </EntityPeekAheadPopover>
    );
  };

  return (
    <Grid container spacing={2}>
      <DetailsField
        label="Summary"
        gridSizes={{ xs: 12 }}
        value={summary}
      />

      <DetailsField 
        label="Initiative" 
        gridSizes={{ xs: 12, md: 6 }}
      >
        {id ? (
          <Link
            to={`https://issues.redhat.com/browse/${id}`}
            target="_blank"
            rel="noopener"
          >
            {id}
          </Link>
        ) : (
          <span>Not specified</span>
        )}
      </DetailsField>

      <DetailsField
        label="Phase"
        gridSizes={{ xs: 12, md: 6 }}
        value={phase}
      />

      <DetailsField 
        label="Status" 
        gridSizes={{ xs: 12, md: 6 }}
      >
        {status ? (
          <span style={{ 
            color: getStatusColor(status),
            fontWeight: 'bold'
          }}>
            {status}
          </span>
        ) : (
          <span>Not specified</span>
        )}
      </DetailsField>

      <DetailsField 
        label="Tags" 
        gridSizes={{ xs: 12, md: 6 }}
      >
        {renderTags()}
      </DetailsField>

      <DetailsField 
        label="Owner" 
        gridSizes={{ xs: 12, md: 6 }}
      >
        {renderOwner()}
      </DetailsField>
    </Grid>
  );
};
