import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
  makeStyles,
} from '@material-ui/core';
import GroupIcon from '@material-ui/icons/People';
import PersonIcon from '@material-ui/icons/Person';
import { Entity } from '@backstage/catalog-model';
import {
  EntityPeekAheadPopover,
  EntityRefLink,
  humanizeEntityRef,
  useStarredEntity,
} from '@backstage/plugin-catalog-react';
import { getEntityIcon } from '../utils/getEntityIcon';
import FavoriteIcon from '@material-ui/icons/BookmarkTwoTone';
import FavoriteBorderIcon from '@material-ui/icons/BookmarkBorderTwoTone';

const useStyles = makeStyles(theme => ({
  descriptionText: {
    display: '-webkit-box',
    '-webkit-line-clamp': 1,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  actions: {
    transform: 'none',
    top: theme.spacing(1),
    marginTop: '.25rem',
  },
  smallChip: {
    '& span': {
      lineHeight: 'inherit',
    },
  },
}));

interface CatalogItemProps {
  entity: Entity;
  defaultKind?: string;
}

export const CatalogItem = ({ entity, defaultKind }: CatalogItemProps) => {
  const { descriptionText, actions, smallChip } = useStyles();
  const { isStarredEntity, toggleStarredEntity } = useStarredEntity(entity);

  const hasAppCode = Boolean(
    entity.metadata.annotations?.['servicenow.com/appcode'],
  );

  const entityRef = humanizeEntityRef(entity);

  const owner = entity.spec?.owner?.toString();
  const shortOwner = owner?.split('/')?.[1] ?? owner;

  const system = entity.spec?.system?.toString();
  const systemRef = system?.startsWith('system:') ? system : `system:${system}`;

  const ownerIcon = owner?.startsWith('group:') ? (
    <GroupIcon />
  ) : (
    <PersonIcon />
  );

  return (
    <ListItem alignItems="flex-start">
      <ListItemIcon>{getEntityIcon(entity)}</ListItemIcon>
      <ListItemText
        primary={
          <Typography>
            <EntityRefLink
              entityRef={entityRef}
              defaultKind={defaultKind ?? 'Component'}
              title={entity.metadata.title ?? entity.metadata.name}
            />
            <Box display='inline' marginLeft='0.25rem'>
            <IconButton
              size='small'
              color={isStarredEntity ? 'secondary' : 'default'}
              aria-label="Favorite"
              onClick={() => toggleStarredEntity()}
            >
              {isStarredEntity ? <FavoriteIcon fontSize='small' /> : <FavoriteBorderIcon fontSize='small' />}
            </IconButton>
            </Box>
          </Typography>
        }
        secondary={
          <span className={descriptionText}>{entity.metadata.description}</span>
        }
      />
      <ListItemSecondaryAction className={actions}>
        {hasAppCode && (
          <Chip
            className={smallChip}
            size="small"
            label={entity.metadata.annotations?.['servicenow.com/appcode']}
          />
        )}
        {system && (
          <EntityPeekAheadPopover entityRef={systemRef}>
            <Chip className={smallChip} size="small" label={system} />
          </EntityPeekAheadPopover>
        )}
        {owner && (
          <EntityPeekAheadPopover entityRef={owner}>
            <Chip
              className={smallChip}
              size="small"
              label={shortOwner}
              variant="outlined"
              icon={ownerIcon}
            />
          </EntityPeekAheadPopover>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
};
