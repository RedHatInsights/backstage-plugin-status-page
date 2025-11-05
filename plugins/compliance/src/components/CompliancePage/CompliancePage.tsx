import {
  Page,
  Header,
  Content,
  HeaderLabel,
  InfoCard,
  Link,
} from '@backstage/core-components';
import {
  Typography,
  Grid,
  Chip,
  makeStyles,
  Box,
  CardActions,
  Button,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import InfoIcon from '@material-ui/icons/InfoOutlined';

const useStyles = makeStyles(theme => ({
  cardContent: {
    padding: '16px',
    cursor: 'pointer',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  infoCardRoot: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.3s ease-in-out',
    boxShadow: theme.shadows[1],
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      boxShadow: theme.shadows[6],
    },
  },
  cardInner: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  description: {
    color: theme.palette.text.primary,
    lineHeight: 1.6,
    fontWeight: 400,
    display: '-webkit-box',
    '-webkit-line-clamp': 4,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexGrow: 1,
  },
  customHeader: {
    '& .MuiCardHeader-title': {
      fontSize: '16px !important',
      fontFamily:
        'RedHatDisplay, "Helvetica Neue", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important',
      fontWeight: '500 !important',
      lineHeight: '1.6 !important',
      marginBottom: '2px !important',
    },
  },
  chipContainer: {
    display: 'flex',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(2),
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  chipStyle: {
    fontWeight: 400,
    fontSize: '0.65rem',
    height: '20px',
  },
  cardActions: {
    justifyContent: 'flex-end',
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: 'auto',
  },
  viewDetailsButton: {
    textTransform: 'none',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.primary.main,
  },
  cardTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  infoButton: {
    padding: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),
  },
}));

interface ComplianceTool {
  name: string;
  description: string;
  path: string;
  tags: string[];
  disabled?: boolean;
  disclaimer?: string;
}

const tools: ComplianceTool[] = [
  {
    name: 'Audit Access Manager',
    description:
      'The Audit Access Manager in XE Compass automates quarterly audits, enabling easy initiation, bulk access reviews, approvals, and compliance tracking.',
    path: '/audit-access-manager',
    tags: ['Access Control', 'Audit', 'Security'],
  },
  {
    name: 'System Audit - Exposed Services',
    description:
      'View and manage system audit data for all registered applications, including audit review status, responsible parties, and compliance tracking.',
    path: '/compliance/system-audit',
    tags: ['Audit', 'Registry', 'Compliance'],
  },
  {
    name: 'ESS',
    description:
      'A centralized compliance view would reduce overhead, eliminate duplication, and provide clearer ownership and lifecycle tracking across platforms and applications.',
    path: '/compliance/ess',
    tags: ['ESS', 'Compliance', 'Security Standards'],
  },
  {
    name: 'GDPR',
    description:
      'Manage GDPR requests in a standardized and automated way, integrating seamlessly with Drupal applications and Compass workflows.',
    path: '/compliance/gdpr',
    tags: ['Data Privacy', 'GDPR', 'Automation'],
    disclaimer:
      'Note: This feature is currently controlled by a feature flag. To enable it, navigate to Settings > Feature Flags and activate it for the GDPR Plugin. Access is currently limited to a specific team.',
  },
];

export const CompliancePage = () => {
  const classes = useStyles();

  return (
    <Page themeId="tool">
      <Header
        title="Compliance Hub"
        subtitle="One place to track, manage, and automate compliance workflows"
      >
        <HeaderLabel label="Owner" value="AppDev" />
        <HeaderLabel label="Lifecycle" value="Production" />
      </Header>
      <Content>
        <Typography variant="h5" gutterBottom>
          Get Started with Compliance Tools
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Quickly launch compliance plugins to audit access, validate ESS
          controls, and ensure GDPR adherence. Select a tool below to open and
          manage its compliance workflows.
        </Typography>

        <Grid container spacing={3}>
          {tools.map(tool => (
            <Grid item xs={12} sm={6} md={4} key={tool.name}>
              <InfoCard
                title={
                  tool.disclaimer ? (
                    <div className={classes.cardTitleContainer}>
                      <span>{tool.name}</span>
                      <Tooltip title={tool.disclaimer} placement="top">
                        <IconButton className={classes.infoButton} size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  ) : (
                    tool.name
                  )
                }
                noPadding
                variant="gridItem"
                subheader={null}
                headerProps={{ className: classes.customHeader }}
                className={classes.infoCardRoot}
              >
                <Box className={classes.cardInner}>
                  <Box className={classes.cardContent}>
                    <Typography variant="body2" className={classes.description}>
                      {tool.description}
                    </Typography>
                  </Box>

                  {tool.tags.length > 0 && (
                    <Box style={{ padding: '0 16px 16px 16px' }}>
                      <div className={classes.chipContainer}>
                        {tool.tags.map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            color="default"
                            variant="outlined"
                            className={classes.chipStyle}
                          />
                        ))}
                      </div>
                    </Box>
                  )}

                  <CardActions className={classes.cardActions}>
                    {tool.disabled ? (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<ArrowForwardIcon />}
                        className={classes.viewDetailsButton}
                        disabled
                      >
                        Open
                      </Button>
                    ) : (
                      <Link to={tool.path}>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<ArrowForwardIcon />}
                          className={classes.viewDetailsButton}
                        >
                          Open
                        </Button>
                      </Link>
                    )}
                  </CardActions>
                </Box>
              </InfoCard>
            </Grid>
          ))}
        </Grid>
      </Content>
    </Page>
  );
};
