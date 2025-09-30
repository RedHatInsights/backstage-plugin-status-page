import {
  AssistantIcon,
  AssistantPanel,
} from '@compass/backstage-plugin-assistant';
import { IconButton } from '@material-ui/core';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { CSSProperties, useEffect, useState } from 'react';

type AssistantButtonProps = {
  title?: string;
  tooltip?: string;
  color?: 'inherit' | 'default' | 'primary' | 'secondary';
  size?: 'small' | 'medium';
  layout?: CSSProperties;
};

export const AssistantButton = ({
  title,
  tooltip,
  color = 'inherit',
  layout,
  size,
}: AssistantButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const togglePanel = (): void => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('assistant-open');
    } else {
      document.body.classList.remove('assistant-open');
    }
  }, [isOpen]);

  const handleResize = (width: string) => {
    document.body.style.setProperty('--assistant-panel-width', width);
  };

  return (
    <Box sx={layout}>
      <Tooltip title={tooltip}>
        <IconButton
          color={color}
          size={size}
          aria-label={title}
          onClick={togglePanel}
        >
          <AssistantIcon />
        </IconButton>
      </Tooltip>
      <AssistantPanel
        open={isOpen}
        onClose={togglePanel}
        onResize={handleResize}
      />
    </Box>
  );
};
