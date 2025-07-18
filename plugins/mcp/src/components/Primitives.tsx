import {
  EmptyState,
  InfoCard,
  InfoCardVariants,
  OverflowTooltip,
  Progress,
} from '@backstage/core-components';
import { useAsyncEntity } from '@backstage/plugin-catalog-react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
  useTheme,
} from '@material-ui/core';
import ToolsIcon from '@material-ui/icons/BuildTwoTone';
import PromptIcon from '@material-ui/icons/CodeTwoTone';
import ResourcesIcon from '@material-ui/icons/DescriptionTwoTone';
import { isEmpty, startCase } from 'lodash';
import { useMemo } from 'react';
import { MCPServerEntity } from '../types';

export const MCPPrimitives = (props: { variant?: InfoCardVariants }) => {
  const { entity, loading } = useAsyncEntity<MCPServerEntity>();
  const theme = useTheme();

  const primitives = useMemo(() => entity?.spec?.primitives || [], [entity]);
  const groupedPrimitives = useMemo(() => {
    return primitives.reduce(
      (groups, primitive) => {
        if (primitive.type === 'tool') {
          groups.tools.push(primitive);
        } else if (primitive.type === 'resource') {
          groups.resources.push(primitive);
        } else if (primitive.type === 'prompt') {
          groups.prompts.push(primitive);
        }

        return groups;
      },
      { tools: [], resources: [], prompts: [] } as Record<string, any[]>,
    );
  }, [primitives]);

  const getPrimitiveIcon = (type: 'tool' | 'resource' | 'prompt') => {
    switch (type) {
      case 'tool':
        return <ToolsIcon />;
      case 'resource':
        return <ResourcesIcon />;
      case 'prompt':
        return <PromptIcon />;
      default:
        return null;
    }
  };

  return (
    <InfoCard title="Primitives" variant={props.variant} noPadding>
      {loading ? <Progress variant="indeterminate" /> : null}
      {primitives.length === 0 ? (
        <EmptyState missing="field" title="Primitives not found" />
      ) : (
        <List>
          {Object.keys(groupedPrimitives).map(
            group =>
              !isEmpty(groupedPrimitives[group]) && (
                <>
                  <ListSubheader>
                    <Typography variant="subtitle2">
                      {startCase(group)}
                    </Typography>
                  </ListSubheader>
                  {groupedPrimitives[group].map(tool => (
                    <ListItem key={tool.name} dense>
                      <ListItemIcon
                        style={{
                          marginRight: '1rem',
                          minWidth: '1.5rem',
                        }}
                      >
                        {getPrimitiveIcon(tool.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            fontFamily="monospace"
                            color={theme.palette.text.primary}
                          >
                            <OverflowTooltip text={tool.name} />
                          </Box>
                        }
                        primaryTypographyProps={{
                          variant: 'body1',
                        }}
                        secondary={<OverflowTooltip text={tool.description} />}
                      />
                    </ListItem>
                  ))}
                </>
              ),
          )}
        </List>
      )}
    </InfoCard>
  );
};
