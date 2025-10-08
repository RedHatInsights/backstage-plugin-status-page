import { stringifyEntityRef } from '@backstage/catalog-model';
import { EntityDisplayName } from '@backstage/plugin-catalog-react';
import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  Box,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Paper,
} from '@material-ui/core';
import { useState } from 'react';
import { ContributorDetails } from './ContributorDetails';
import { Contributor } from './types';
import { EmptyState } from '@backstage/core-components';

const useStyles = makeStyles(theme => ({
  root: {
    height: '400px', // fill available height
    minHeight: 0,
    display: 'flex',
  },
  leftPanel: {
    width: '40%',
    [theme.breakpoints.up('lg')]: {
      width: '30%',
    },
    padding: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // required for scroll inside flex
  },
  listContainer: {
    flex: 1,
    overflow: 'auto',
    borderRadius: '4px',
  },
  listText: {
    fontWeight: 470,
  },

  selected:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.link,
          '&.Mui-selected': {
            backgroundColor: theme.palette.infoBackground,
          },
          '&.Mui-selected:hover': {
            backgroundColor: theme.palette.infoBackground,
          },
        }
      : {
          color: theme.palette.link,
          borderLeft: `4px solid ${theme.palette.link}`,
        },
  list: {
    borderRadius: '4px',
    ...(theme.palette.type === 'light'
      ? {
          '&:hover': {
            backgroundColor: `${theme.palette.infoBackground}88`,
          },
        }
      : {}),
  },
}));

type ContributorsListProps = {
  workstreams: WorkstreamEntity[];
  arts: ArtEntity[];
};

function convertWorkstreamsToMemberMapping(
  workstreams: (WorkstreamEntity | ArtEntity)[],
): Contributor[] {
  const memberMap = new Map<
    string,
    Array<{ workstreamRef: string; role: string }>
  >();

  // Iterate through each workstream
  for (const workstream of workstreams) {
    const workstreamRef = stringifyEntityRef(workstream);

    // Iterate through each member in the workstream
    for (const member of workstream.spec.members) {
      const { userRef, role } = member;

      // If this member hasn't been seen before, initialize their array
      if (!memberMap.has(userRef)) {
        memberMap.set(userRef, []);
      }

      // Add this workstream-role combination to the member's list
      memberMap.get(userRef)!.push({
        workstreamRef,
        role,
      });
    }

    // Process lead (if exists)
    if (workstream.kind === 'Workstream' && workstream.spec.lead) {
      const leadUserRef = workstream.spec.lead;

      if (!memberMap.has(leadUserRef)) {
        memberMap.set(leadUserRef, []);
      }

      memberMap.get(leadUserRef)!.push({
        workstreamRef,
        role: 'Workstream Lead', // Fixed typo: "Leam" → "Lead"
      });
    }

    // Process lead (if exists)
    if (workstream.kind === 'ART' && workstream.spec.rte) {
      const rteUserRef = workstream.spec.rte;

      if (!memberMap.has(rteUserRef)) {
        memberMap.set(rteUserRef, []);
      }

      memberMap.get(rteUserRef)!.push({
        workstreamRef,
        role: 'Release Train Engineer',
      });
    }
  }

  // Convert the map to the desired array format
  return Array.from(memberMap.entries()).map(([userRef, commonWs]) => ({
    userRef,
    commonWs,
  }));
}

export const ContributorsList = ({
  workstreams,
  arts,
}: ContributorsListProps) => {
  const classes = useStyles();
  const [listItems, setListItems] = useState<Contributor[]>(
    convertWorkstreamsToMemberMapping([...arts, ...workstreams]),
  );
  const [selectedContributor, setSelectedContributor] = useState<Contributor>();
  const [filterChips, setFilterChips] = useState([
    {
      label: 'Both',
      selected: true,
    },
    {
      label: 'Workstreams',
      selected: false,
    },
    {
      label: 'ARTs',
      selected: false,
    },
  ]);

  function handleClick(selData: Contributor) {
    setSelectedContributor(selData);
  }

  return (
    <Paper className={classes.root}>
      <Box className={classes.leftPanel}>
        {/* <TextField variant="outlined" fullWidth placeholder="Find by name" /> */}
        <Grid>
          {filterChips.map(chip => (
            <Chip
              key={chip.label}
              label={chip.label}
              clickable
              color={chip.selected ? 'primary' : 'default'}
              size="small"
              variant={chip.selected ? 'default' : 'outlined'}
              onClick={() => {
                setFilterChips(prev =>
                  prev.map(c => ({
                    ...c,
                    selected: c.label === chip.label,
                  })),
                );
                if (chip.label.startsWith('Workstreams'))
                  setListItems(convertWorkstreamsToMemberMapping(workstreams));
                else if (chip.label.startsWith('ARTs'))
                  setListItems(convertWorkstreamsToMemberMapping(arts));
                else if (chip.label.startsWith('Both'))
                  setListItems(
                    convertWorkstreamsToMemberMapping([
                      ...arts,
                      ...workstreams,
                    ]),
                  );
                setSelectedContributor(undefined);
              }}
            />
          ))}
        </Grid>

        <List className={classes.listContainer}>
          {listItems
            .filter(data => data.commonWs.length > 1)
            .sort((a, b) => b.commonWs.length - a.commonWs.length)
            .map(data => (
              <ListItem
                button
                TouchRippleProps={{
                  color: 'blue',
                }}
                classes={{ selected: classes.selected, root: classes.list }}
                selected={selectedContributor?.userRef === data.userRef}
                onClick={() => handleClick(data)}
              >
                <ListItemText classes={{ primary: classes.listText }}>
                  <EntityDisplayName hideIcon entityRef={data.userRef} />
                </ListItemText>
                <ListItemSecondaryAction>
                  <Chip
                    style={{ marginBottom: 0 }}
                    label={data.commonWs.length}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
        </List>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box padding={2} paddingX={2} width="100%" overflow="hidden">
        {selectedContributor ? (
          <ContributorDetails contributor={selectedContributor} />
        ) : (
          <EmptyState
            title="No Information to display"
            missing="data"
            description="Please select a user from the list on left panel."
          />
        )}
      </Box>
    </Paper>
  );
};
