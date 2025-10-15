import { Link, InfoCard } from '@backstage/core-components';
import {
  Typography,
  Grid,
  Chip,
  makeStyles,
  Box,
  CardActions,
  Button
} from '@material-ui/core';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { Platform } from '../../types';

const useStyles = makeStyles(theme => ({
  cardContent: {
    padding: '16px',
    cursor: 'pointer',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cardContainer: {
    height: '100%',
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
      boxShadow: theme.shadows[6], // smoother shadow on hover
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
      fontFamily: 'RedHatDisplay, "Helvetica Neue", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important',
      fontWeight: '500 !important',
      lineHeight: '1.6 !important',
      marginBottom: '2px !important',
    },
  },
  platformChips: {
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
    color: theme.palette.primary.main
  },
}));

interface PlatformCardViewProps {
  platforms: Platform[];
}

export const PlatformCardView = ({ platforms }: PlatformCardViewProps) => {
  const classes = useStyles();

  const handleCardClick = (platformName: string) => {
    // Use the metadata.name (platformName) directly for routing
    window.location.href = `/compliance/ess/platform/${encodeURIComponent(platformName)}`;
  };

  const truncateDescription = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength).trim()}...`;
  };

  const getPlatformChips = (platform: Platform) => {
    const chips: Array<{ label: string; color: 'default' }> = [];
    
    // Add namespace (without "type: platform" references)
    if (platform.metadata?.namespace && chips.length < 3) {
      chips.push({ label: platform.namespace || platform.metadata.namespace, color: 'default' });
    }
    
    // Add kind (without "type: platform" references)
    if (platform.kind && platform.kind.toLowerCase() !== 'platform' && chips.length < 3) {
      chips.push({ label: platform.kind, color: 'default' });
    }
    
    // Add tags (filter out "ess" and "platform" tags, and avoid "type:" prefixed items)
    if (platform.metadata?.tags && platform.metadata.tags.length > 0 && chips.length < 3) {
      const remainingSlots = 3 - chips.length;
      const filteredTags = platform.metadata.tags.filter((tag: string) => 
        tag.toLowerCase() !== 'ess' && 
        tag.toLowerCase() !== 'platform' &&
        !tag.toLowerCase().startsWith('type:')
      ).slice(0, remainingSlots);
      
      filteredTags.forEach((tag: string) => {
        chips.push({ label: tag, color: 'default' });
      });
    }
    
    // Add spec entries if still under 3 chips
    if (platform.spec && chips.length < 3) {
      const remainingSlots = 3 - chips.length;
      const specEntries = Object.entries(platform.spec).slice(0, remainingSlots);
      specEntries.forEach(([key, value]) => {
        if (typeof value === 'string' && value.length < 20 && chips.length < 3 &&
            key.toLowerCase() !== 'type' && !key.toLowerCase().includes('platform')) {
          chips.push({ label: `${key}: ${value}`, color: 'default' });
        }
      });
    }
    
    return chips.slice(0, 3);
  };

  return (
    <Grid container spacing={3}>
      {platforms.map(platform => {
        const allChips = getPlatformChips(platform);
        const description = platform.description || 'No description available';
        const truncatedDescription = truncateDescription(description);

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={platform.name}>
            <InfoCard
              title={platform.metadata.title || platform.name}
              noPadding
              variant="gridItem"
              subheader={null}
              headerProps={{ className: classes.customHeader }}
              className={classes.infoCardRoot} // shadow applied directly here
            >
              <Box className={classes.cardInner}>
                <Box
                  className={classes.cardContent}
                  onClick={() => handleCardClick(platform.name)}
                >
                  <Typography variant="body2" className={classes.description}>
                    {truncatedDescription}
                  </Typography>
                </Box>

                {allChips.length > 0 && (
                  <Box style={{ padding: '0 16px 16px 16px' }}>
                    <div className={classes.platformChips}>
                      {allChips.map((chip, index) => (
                        <Chip
                          key={index}
                          label={chip.label}
                          size="small"
                          color={chip.color}
                          variant="outlined"
                          className={classes.chipStyle}
                        />
                      ))}
                    </div>
                  </Box>
                )}

                <CardActions className={classes.cardActions}>
                  <Link to={`/compliance/ess/platform/${encodeURIComponent(platform.name)}`}>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<ArrowForwardIcon />}
                      onClick={(e) => e.stopPropagation()}
                      className={classes.viewDetailsButton}
                    >
                      View Details
                    </Button>
                  </Link>
                </CardActions>

              </Box>
            </InfoCard>
          </Grid>
        );
      })}
    </Grid>
  );
};
