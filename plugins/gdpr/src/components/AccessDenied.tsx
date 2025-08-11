import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  makeStyles,
  Theme,
} from '@material-ui/core';
import {
  ErrorPanel,
  Content,
  Header,
  Page,
  HeaderLabel,
} from '@backstage/core-components';
import LockIcon from '@material-ui/icons/Lock';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    padding: theme.spacing(4),
    textAlign: 'center',
    maxWidth: 600,
    margin: '0 auto',
  },
  icon: {
    fontSize: 64,
    color: theme.palette.warning.main,
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  description: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
  },
  groupName: {
    fontFamily: 'monospace',
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
  },
  buttonContainer: {
    marginTop: theme.spacing(3),
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  instructionsList: {
    textAlign: 'left',
    marginTop: theme.spacing(2),
    '& li': {
      marginBottom: theme.spacing(1),
    },
  },
}));

interface AccessDeniedProps {
  /**
   * Optional error message to display
   */
  error?: string;
  /**
   * Optional user information for debugging
   */
  userInfo?: {
    userId: string;
    entityRef: string;
    groups: string[];
  };
}

/**
 * AccessDenied component for GDPR plugin
 * Displays when user doesn't have required permissions
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({
  error,
  userInfo,
}) => {
  const classes = useStyles();

  const handleContactSupport = () => {
    // You can customize this to open email client or support system
    const subject = 'GDPR Plugin Access Request';
    const body = `Hi,

I need access to the GDPR plugin. 

User Details:
- User ID: ${userInfo?.userId || 'Unknown'}
- Entity Ref: ${userInfo?.entityRef || 'Unknown'}
- Current Groups: ${userInfo?.groups?.join(', ') || 'None'}

Please add me to the "compass-gdpr-admin" group.

Thank you!`;

    const mailtoLink = `mailto:gdpr-admin@company.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleRequestAccess = () => {
    // You can customize this to redirect to access request system
    // For now, we'll use a placeholder URL
    window.open('/permission-management', '_blank');
  };

  if (error) {
    return (
      <Page themeId="tool">
        <Header title="GDPR Data Management">
          <HeaderLabel label="Status" value="Access Check Failed" />
        </Header>
        <Content>
          <ErrorPanel
            title="Error Checking Access"
            error={new Error(error)}
          />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header title="GDPR Data Management">
        <HeaderLabel label="Status" value="Access Denied" />
      </Header>
      <Content>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Paper className={classes.paper} elevation={2}>
            <LockIcon className={classes.icon} />
            
            <Typography variant="h4" className={classes.title}>
              Access Restricted
            </Typography>
            
            <Typography variant="body1" className={classes.description}>
              You don't have the required permissions to access the GDPR Data Management plugin.
              To use this tool, you need to be a member of the{' '}
              <span className={classes.groupName}>compass-gdpr-admin</span> group.
            </Typography>

            <Box className={classes.instructionsList}>
              <Typography variant="h6" gutterBottom>
                How to request access:
              </Typography>
              <ol>
                <li>
                  <Typography variant="body2">
                    Contact your system administrator or GDPR team
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Request membership to the "compass-gdpr-admin" Rover group
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Once added, refresh this page to gain access
                  </Typography>
                </li>
              </ol>
            </Box>

            <Box className={classes.buttonContainer}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ContactSupportIcon />}
                onClick={handleContactSupport}
              >
                Contact Support
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleRequestAccess}
                disabled
              >
                Request Access
              </Button>
              
              <Button
                variant="text"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>


          </Paper>
        </Box>
      </Content>
    </Page>
  );
};
