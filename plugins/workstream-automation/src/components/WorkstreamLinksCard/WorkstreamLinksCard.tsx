import { workstreamUpdatePermission } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  Entity,
  EntityLink,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  AppIcon,
  InfoCard,
  InfoCardVariants,
  OverflowTooltip,
  Progress,
} from '@backstage/core-components';
import { useAsyncEntity } from '@backstage/plugin-catalog-react';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Typography,
} from '@material-ui/core';
import ExpandMore from '@material-ui/icons/ExpandMore';
import pluralize from 'pluralize';
import React, { useState } from 'react';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import { LinksEditModal } from './LinksEditModal';

const useStyles = makeStyles(theme => ({
  heading: {
    color: theme.palette.text.primary,
    fontWeight: 600,
    fontSize: '1.1rem',
  },
  secondaryHeading: {
    textAlign: 'right',
    color: theme.palette.text.secondary,
    marginLeft: 'auto',
  },
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
}));

export const WorkstreamLinksCard = (props: { variant: InfoCardVariants }) => {
  const { entity, loading } = useAsyncEntity<Entity>();
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  if (loading || !entity) return <Progress variant="indeterminate" />;

  const links = entity.metadata.links;
  if (!links) return null;

  const groupedLinks = links.reduce<{ [type: string]: EntityLink[] }>(
    (prevVal, currVal) => {
      if (!prevVal[currVal.type!]) {
        prevVal[currVal.type ?? 'Other'] = [];
      }
      prevVal[currVal.type ?? 'Other'].push(currVal);
      return prevVal;
    },
    {},
  );

  const linkTypes = Object.keys(groupedLinks);

  return (
    <InfoCard
      {...props}
      title="Links"
      noPadding
      headerProps={{
        classes: { action: classes.action },
        action: (
          <RequirePermission
            permission={workstreamUpdatePermission}
            resourceRef={stringifyEntityRef(entity)}
            errorPage={null}
          >
            <IconButton onClick={() => setOpen(true)}>
              <EditTwoTone />
            </IconButton>
          </RequirePermission>
        ),
      }}
    >
      <LinksEditModal
        links={links}
        open={open}
        workstreamName={entity.metadata.name}
        setModalOpen={setOpen}
      />
      {linkTypes.map(type => (
        <Accordion defaultExpanded key={type}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography className={classes.heading}>{type}</Typography>
            <Typography className={classes.secondaryHeading}>
              {groupedLinks[type].length}&nbsp;
              {pluralize('Link', groupedLinks[type].length)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List component="ul" disablePadding style={{ width: '100%' }}>
              {groupedLinks[type].map(link => (
                <ListItem
                  key={link.url}
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={link.url}
                  button
                >
                  <ListItemIcon>
                    {link.icon ? <AppIcon id={link.icon} /> : '-'}
                  </ListItemIcon>
                  <ListItemText
                    primary={<OverflowTooltip text={link.title} />}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </InfoCard>
  );
};
