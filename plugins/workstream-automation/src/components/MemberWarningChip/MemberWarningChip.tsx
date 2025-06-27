import GroupWorkIcon from '@material-ui/icons/GroupWork';
import {
  bindPopover,
  bindHover,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  Paper,
  Typography,
} from '@material-ui/core';
import { CustomUserEntity } from '../../types';
import { getWorkstreamsRelations } from '../../utlis/getWorkstreamMembers';
import { artRolesMap, getRoleFromRelation } from '../../utlis/roleMapper';
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
        <Paper elevation={0}>
          <Typography style={{ padding: '10px' }}>
            This associate is in more than one workstream
          </Typography>
          <Divider />
          <List disablePadding>
            {relations.map(v => (
              <ListItem key={v.targetRef}>
                <Box display="flex" justifyContent="space-between" width="100%">
                  <EntityRefLink
                    target="_blank"
                    component={Typography}
                    variant="subtitle2"
                    entityRef={v.targetRef}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginRight: '8px',
                    }}
                  />
                  <Typography variant="body2" style={{ marginLeft: 2 }}>
                    {getRoleFromRelation(v.type, {
                      leadOf: 'Workstream Lead',
                      'release-train-engineer': 'Release Train Engineer (RTE)',
                      ...customRoles,
                      ...artRolesMap,
                    })}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      </HoverPopover>
    </>
  );
};
