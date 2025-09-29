import IconButton from '@mui/material/IconButton';
import { PropTypes } from '@mui/material/index';
import Tooltip from '@mui/material/Tooltip';
import { AppIcon } from '@backstage/core-components';
import Box from '@mui/material/Box';
import { CSSProperties } from 'react';

type AppBarLinkButtonProps = {
  title?: string;
  tooltip?: string;
  color?: PropTypes.Color;
  size: 'small' | 'medium' | 'large' | undefined;
  layout?: CSSProperties;
  icon: string;
};

export const AppBarLinkButton = ({
  title,
  tooltip,
  size,
  color,
  layout,
  icon,
}: AppBarLinkButtonProps) => {
  return (
    <Box sx={layout}>
      <Tooltip title={tooltip}>
        <IconButton color={color} size={size} aria-label={title}>
          <AppIcon id={icon} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
