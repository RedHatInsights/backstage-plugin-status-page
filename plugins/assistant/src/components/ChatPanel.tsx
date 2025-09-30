import { Progress } from '@backstage/core-components';
import {
  Drawer,
  DrawerProps,
  makeStyles,
  Theme,
  useMediaQuery,
} from '@material-ui/core';
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import { useContext, useEffect } from 'react';
import { useLocalStorage } from 'react-use';
import pkg from '../../package.json';
import { AgentContext } from '../contexts/AgentProvider';
import { ChatFooter } from './ChatFooter';
import { ChatHeader } from './ChatHeader';
import { ChatLog } from './ChatLog';

const useStyles = makeStyles<Theme & ThemeConfig>(theme => ({
  panel: {
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    height: '100svh',
    boxShadow: theme.shadows[4],
    overflow: 'visible',
    borderLeftWidth: 0.5,
    borderLeftStyle: 'solid',
    borderLeftColor: 'var(--bui-border)'
  },
}));

type Props = Pick<DrawerProps, 'open' | 'onClose'> & {
  open?: boolean;
  onClose?: () => void;
  onResize?: (width: string) => void;
};

export const ChatPanel = ({ open, onClose, onResize }: Props) => {
  const { loading, user } = useContext(AgentContext);
  const [isPinned, setPinned] = useLocalStorage<boolean>(
    `${pkg.name}:AssistantPanel:pinnedState`,
    false,
  );

  const smBreakpoint = useMediaQuery('sm');
  const classes = useStyles();

  useEffect(() => {
    /* TODO: Calculate the width of the panel */
    if (!smBreakpoint && isPinned) {
      onResize?.('400px');
    } else {
      onResize?.('0px');
    }
  }, [onResize, smBreakpoint, isPinned]);

  const handlePinnedState = (pinnedState: boolean) => {
    setPinned(pinnedState);
  };

  return (
    <Drawer
      variant={open && isPinned ? 'permanent' : 'temporary'}
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        className: classes.panel,
      }}
    >
      <ChatHeader
        onClose={onClose}
        isPinned={isPinned}
        togglePin={handlePinnedState}
      />
      <ChatLog user={user} />
      {loading && <Progress />}
      <ChatFooter />
    </Drawer>
  );
};
