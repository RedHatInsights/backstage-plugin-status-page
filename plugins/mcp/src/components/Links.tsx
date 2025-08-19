import {
  AppIcon,
  InfoCard,
  InfoCardVariants,
  OverflowTooltip,
} from '@backstage/core-components';
import { useAsyncEntity } from '@backstage/plugin-catalog-react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMoreOutlined';
import { startCase } from 'lodash';
import { sortMCPLinks, useMCPLinks } from '../hooks/getMCPLinks';
import { MCPServerEntity } from '../types';

const useStyles = makeStyles(theme => ({
  accordion: {
    outlineColor: theme.palette.divider,
  },
  heading: {
    '& $div': {
      marginBlock: 0,
      paddingBlock: 0,
    },
  },
  chip: {
    margin: 0,
  },
}));

export const MCPLinks = (props: {
  variant?: InfoCardVariants;
  collapsed?: boolean;
}) => {
  const { entity, loading } = useAsyncEntity<MCPServerEntity>();
  const classes = useStyles();

  const groupedLinks = useMCPLinks(entity);
  const sortedLinks = sortMCPLinks(groupedLinks);

  if (loading || !entity) return <></>;

  return (
    <InfoCard title="Links" variant={props.variant} noPadding>
      {sortedLinks.map(([group, links]) => (
        <Accordion
          key={group}
          className={classes.accordion}
          defaultExpanded={!props.collapsed}
          square
          variant="elevation"
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={classes.heading}
          >
            <Typography variant="subtitle2" color="textSecondary">
              {startCase(group)}
            </Typography>
            <Box marginLeft="0.5rem">
              <Chip
                className={classes.chip}
                size="small"
                variant="outlined"
                label={links.length}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails style={{ padding: 0 }}>
            <List component="ul" disablePadding style={{ width: '100%' }}>
              {links.map(link => (
                <ListItem
                  key={encodeURI(link.url)}
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={link.url}
                  button
                >
                  {link.icon ? (
                    <ListItemIcon
                      style={{
                        marginRight: '0.5rem',
                        minWidth: '1.5rem',
                      }}
                    >
                      {link.icon ? <AppIcon id={link.icon} fontSize='small' /> : <></>}
                    </ListItemIcon>
                  ) : null}
                  <ListItemText
                    primary={<OverflowTooltip text={link.title} />}
                    primaryTypographyProps={{
                      color: 'secondary',
                      variant: 'subtitle2',
                    }}
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
