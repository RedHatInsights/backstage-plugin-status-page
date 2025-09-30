import {
  Box,
  Chip,
  Fab,
  IconButton,
  makeStyles,
  Theme,
  Toolbar,
  Tooltip,
  Typography,
} from '@material-ui/core';
import ResetIcon from '@material-ui/icons/DeleteSweepOutlined';
import CloseIcon from '@material-ui/icons/LastPageRounded';
import RefreshIcon from '@material-ui/icons/RefreshOutlined';
import PinnedIcon from '@material-ui/icons/VerticalSplit';
import PinIcon from '@material-ui/icons/VerticalSplitOutlined';
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import { clsx } from 'clsx';
import { useContext } from 'react';
import pkg from '../../package.json';
import { AgentContext } from '../contexts/AgentProvider';

const useStyles = makeStyles<Theme & ThemeConfig>(theme => ({
  header: {
    position: 'relative',
    padding: theme.spacing(2),
    paddingLeft: theme.spacing(4),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    background:
      theme.palette.mode === 'light'
        ? theme.palette.background.paper
        : theme.palette.background.default,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--bui-border)',
  },
  close: {
    position: 'absolute',
    left: theme.spacing(-2.5),
    boxShadow: theme.shadows[6],
    color: theme.palette.text.primary,
    background:
      theme.palette.mode === 'light'
        ? theme.palette.background.paper
        : theme.palette.background.default,
    '&:hover': {
      background: theme.palette.background.default,
    },
  },
  headerPinned: {
    paddingLeft: theme.spacing(2),
  },
}));

export interface ChatHeaderProps {
  isPinned?: boolean;
  onClose?: () => void;
  togglePin?: (pinnedState: boolean) => void;
}

export const ChatHeader = ({
  isPinned = false,
  onClose,
  togglePin,
}: ChatHeaderProps) => {
  const classes = useStyles();
  const { loading, reloadChat, clearChat } = useContext(AgentContext);

  const lifecycle = (['alpha', 'beta'] as const).find(lc => pkg.version.toLowerCase().includes(lc.toLowerCase()));

  const handlePinClick = () => {
    togglePin?.(!isPinned);
  };

  return (
    <Toolbar
      disableGutters
      className={clsx(classes.header, isPinned && classes.headerPinned)}
    >
      <Tooltip title="Close sidebar">
        {isPinned ? (
          <IconButton edge="start" aria-label="close" onClick={onClose}>
            <CloseIcon fontSize="medium" />
          </IconButton>
        ) : (
          <Fab
            variant="circular"
            className={clsx(classes.close)}
            size="small"
            aria-label="close"
            onClick={onClose}
          >
            <CloseIcon fontSize="medium" />
          </Fab>
        )}
      </Tooltip>
      <Box flex={1}>
        <Typography variant="h5" style={{ margin: 0 }}>
          Compass Assistant{' '}
          { lifecycle && <Chip size='small' variant='outlined' label={lifecycle} /> }
        </Typography>
      </Box>
      <Tooltip title="Clear Chat">
        <IconButton edge="end" aria-label="pin" onClick={() => clearChat?.()}>
          <ResetIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Refresh">
        <IconButton
          edge="end"
          aria-label="pin"
          disabled={loading}
          onClick={() => reloadChat?.()}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={isPinned ? 'Unpin' : 'Pin'}>
        <IconButton edge="end" aria-label="pin" onClick={handlePinClick}>
          {isPinned ? <PinnedIcon /> : <PinIcon />}
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
};
