import {
  AssistantIcon,
  AssistantPanel,
} from '@compass/backstage-plugin-assistant';
import { IconButton, makeStyles } from '@material-ui/core';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { CSSProperties, useEffect, useState } from 'react';

const useStyles = makeStyles(theme => ({
  button: {
    transitionProperty: 'all',
    transitionDuration: `${theme.transitions.duration.standard}ms`,
    transitionTimingFunction: theme.transitions.easing.easeInOut,

    'body.assistant-open &, &:hover': {
      backgroundColor: '#e00',
      color: theme.palette.getContrastText('#e00'),
      rotate: '360deg',
    },
    '&:hover': {
      animation: 'Assistant-Icon-Pulse 1.5s ease-in-out 0.5s infinite',
      scale: 'var(--scale)',
    },
    'body.assistant-open &': {
      borderRadius: theme.shape.borderRadius * 4,
    },
  },
}));

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
  const classes = useStyles();
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
          className={classes.button}
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
