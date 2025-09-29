import { DocsBotIcon, DocsBotPanel } from '@appdev/backstage-plugin-docsbot';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { CSSProperties, useEffect, useState } from 'react';

type DocsbotButtonProps = {
  title?: string;
  tooltip?: string;
  color?:
    | 'inherit'
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  size?: 'small' | 'medium' | 'large';
  layout?: CSSProperties;
};

export const DocsbotButton = ({
  title,
  tooltip,
  color='inherit',
  layout,
  size,
}: DocsbotButtonProps) => {
  const [isDocsBotPanelOpen, setIsDocsBotPanelOpen] = useState(false);
  const toggleDrawer = (): void => {
    setIsDocsBotPanelOpen(!isDocsBotPanelOpen);
  };

  useEffect(() => {
    if (isDocsBotPanelOpen) {
      // this class is defined in Root.css
      document.body.classList.add('docsbot-open');
    } else {
      document.body.classList.remove('docsbot-open');
    }
  }, [isDocsBotPanelOpen]);

  return (
    <Box sx={layout}>
      <Tooltip title={tooltip}>
        <IconButton
          color={color}
          size={size}
          aria-label={title}
          onClick={toggleDrawer}
        >
          <DocsBotIcon />
        </IconButton>
      </Tooltip>
      <DocsBotPanel isOpen={isDocsBotPanelOpen} toggleDrawer={toggleDrawer} />
    </Box>
  );
};
