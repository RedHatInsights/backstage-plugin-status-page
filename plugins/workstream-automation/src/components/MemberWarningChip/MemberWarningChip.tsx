import React from 'react';
import GroupWorkIcon from '@material-ui/icons/GroupWork';
import {
  bindHover,
  bindPopover,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import {
  Chip,
  List,
  ListItem,
  ListItemSecondaryAction,
  Paper,
  Typography,
} from '@material-ui/core';
import { CustomUserEntity } from '../../types';
import { getWorkstreamsRelations } from '../../utlis/getWorkstreamMembers';
import { getRoleFromRelation } from '../../utlis/roleMapper';
import { AppIcon } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

export const MemberWarningChip = (props: { user: CustomUserEntity }) => {
  const relations = getWorkstreamsRelations(props.user);
  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'workstream-popover',
  });

  const configApi = useApi(configApiRef);
  const customRoles = configApi.getOptional<{
    [key: string]: string;
  }>('workstream.workstreamRoles');

  if (relations.length < 2) return null;

  return (
    <>
      <Chip
        label={`${relations.length}`}
        avatar={<AppIcon id="kind:workstream" Fallback={GroupWorkIcon} />}
        size="small"
        variant="outlined"
        clickable
        style={{ margin: '4px 0px', float: 'right' }}
        {...bindHover(popupState)}
      />
      <HoverPopover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Paper style={{ padding: '10px' }}>
          <Typography>This associate is in more than one workstream</Typography>
          <List disablePadding>
            {relations.map(v => (
              <ListItem key={v.targetRef}>
                <EntityRefLink
                  target="_blank"
                  component={Typography}
                  variant="subtitle2"
                  entityRef={v.targetRef}
                />
                <ListItemSecondaryAction>
                  {getRoleFromRelation(v.type, {
                    leadOf: 'Workstream Lead',
                    ...customRoles,
                  })}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </HoverPopover>
    </>
  );
};
