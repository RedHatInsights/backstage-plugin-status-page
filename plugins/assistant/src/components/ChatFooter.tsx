import { makeStyles, Theme } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import { ChatInput } from "./ChatInput";
import { Disclosure } from "./Disclosure";

const useStyles = makeStyles<Theme & ThemeConfig>(theme => ({
  footer: {
    backgroundColor:
      theme.palette.mode === 'light'
        ? theme.palette.background.default
        : theme.palette.background.paper,
  },
  divider: {
    backgroundColor: theme.palette.border,
  },
}));

export const ChatFooter = () => {
  const classes = useStyles();

  return (
    <Box
        flex={0}
        flexShrink={0}
        display="flex"
        flexDirection="column"
        justifyContent="end"
        width="inherit"
        className={classes.footer}
        p={2}
        pt={0}
      >
        <Divider className={classes.divider} />
        <ChatInput />
        <Disclosure />
      </Box>
  );
}
