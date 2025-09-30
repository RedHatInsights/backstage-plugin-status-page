import { Progress } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  Fade,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@material-ui/core';
import UpIcon from '@material-ui/icons/ExpandLessRounded';
import DownIcon from '@material-ui/icons/ExpandMoreRounded';
import { useContext, useEffect, useRef, useState } from 'react';
import { AgentContext } from '../contexts/AgentProvider';
import { humanizeToolName } from '../utils/humanizeToolName';

export const ToolsOptions = () => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(
    new Set<string>(),
  );

  const {
    loadingTools: loading,
    availableTools: tools,
    updateSelectedTools,
  } = useContext(AgentContext);

  const toggleOpen = () => {
    setOpen(!isOpen);
  };

  useEffect(() => {
    const updatedTools = new Set(selectedTools);
    selectedTools.forEach(st => {
      if (tools.findIndex(tool => tool.id === st) !== -1) {
        updatedTools.delete(st);
      }
    });
    if (updatedTools.size !== selectedTools.size) {
      setSelectedTools(updatedTools);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tools]);

  useEffect(() => {
    updateSelectedTools(Array.from(selectedTools));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTools]);

  const isSelected = (toolId: string) => {
    return selectedTools.has(toolId);
  };

  const selectTool = (toolId: string) => {
    const newSelectedTools = new Set(selectedTools);

    if (isSelected(toolId)) {
      newSelectedTools.delete(toolId);
    } else {
      newSelectedTools.add(toolId);
    }

    setSelectedTools(newSelectedTools);
  };

  const Icon = isOpen ? DownIcon : UpIcon;

  return (
    <>
      <Button
        size="small"
        onClick={toggleOpen}
        ref={anchorRef}
        aria-label="tools"
      >
        Tools
        <Icon fontSize="small" />
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorRef.current}
        open={isOpen}
        onClose={toggleOpen}
        TransitionComponent={Fade}
        PaperProps={{
          style: {
            maxHeight: '100dvh',
            maxWidth: '400px',
          },
        }}
      >
        {loading && <Progress />}
        {!loading &&
          (tools.length === 0
            ? 'No tools found'
            : tools.map(tool => (
                <MenuItem
                  key={tool.id}
                  onClick={_ => selectTool(tool.id)}
                  selected={isSelected(tool.id)}
                >
                  <Checkbox checked={isSelected(tool.id)} />
                  <Tooltip title={tool.description ?? ''}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="start"
                    >
                      <Typography variant="body2" color="textPrimary">
                        {humanizeToolName(tool.id)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {tool.description}
                      </Typography>
                    </Box>
                  </Tooltip>
                </MenuItem>
              )))}
      </Menu>
    </>
  );
};
