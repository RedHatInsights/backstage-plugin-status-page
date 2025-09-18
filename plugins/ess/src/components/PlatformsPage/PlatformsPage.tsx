import { useState, useEffect } from 'react';
import {
  Page,
  Header,
  Content,
  HeaderLabel,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import {
  Typography,
  TextField,
  InputAdornment,
  Divider,
  ButtonGroup,
  Button,
  Box,
  makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import ViewListIcon from '@material-ui/icons/ViewList';
import { usePlatforms } from '../../hooks/usePlatforms';
import { PlatformCardView } from '../PlatformCardView';
import { PlatformListView } from '../PlatformListView';
import { Platform } from '../../types';
import { hasEssData, createGitLabConfigFromAppConfig } from '../../data/essDataLoader';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

type ViewMode = 'card' | 'list';

const useStyles = makeStyles(theme => ({
  searchContainer: {
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  viewControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  viewToggle: {
    marginLeft: 'auto',
  },
}));

interface PlatformWithEss extends Platform {
  hasEssData?: boolean;
}

export const PlatformsPage = () => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortedPlatforms, setSortedPlatforms] = useState<PlatformWithEss[]>([]);
  const [essCheckLoading, setEssCheckLoading] = useState(false);
  const { platforms, loading, error } = usePlatforms();
  const configApi = useApi(configApiRef);

  // Check ESS data availability for all platforms and sort them
  useEffect(() => {
    if (platforms.length > 0) {
      setEssCheckLoading(true);
      const checkEssData = async () => {
        try {
          const gitlabConfig = createGitLabConfigFromAppConfig(configApi);
          
          const platformsWithEss = await Promise.all(
            platforms.map(async (platform): Promise<PlatformWithEss> => {
              try {
                const hasEss = await hasEssData(platform.name, gitlabConfig);
                return { ...platform, hasEssData: hasEss };
              } catch {
                return { ...platform, hasEssData: false };
              }
            })
          );
          
          // Sort platforms: platforms with ESS data first, then alphabetically by name
          const sorted = platformsWithEss.sort((a, b) => {
            if (a.hasEssData && !b.hasEssData) return -1;
            if (!a.hasEssData && b.hasEssData) return 1;
            return a.name.localeCompare(b.name);
          });
          
          setSortedPlatforms(sorted);
        } catch {
          // If checking fails, just use original platforms without sorting
          setSortedPlatforms(platforms.map(p => ({ ...p, hasEssData: undefined })));
        } finally {
          setEssCheckLoading(false);
        }
      };
      
      checkEssData();
    }
  }, [platforms, configApi]);

  if (loading || essCheckLoading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  // Filter platforms based on search term
  const filteredPlatforms = sortedPlatforms.filter(platform =>
    platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (platform.description && platform.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Page themeId="tool">
      <Header title="ESS Automation Plugin" subtitle="Platform Management Dashboard">
        <HeaderLabel label="Owner" value="AppDev" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <Box className={classes.searchContainer}>
          <TextField
            fullWidth
            placeholder="Search platforms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="small"
          />
        </Box>

        <Divider className={classes.divider} />

        <div className={classes.viewControls}>
          <Typography variant="h6">
            Platforms ({filteredPlatforms.length})
          </Typography>
          <ButtonGroup
            variant="outlined"
            size="small"
            className={classes.viewToggle}
          >
            <Button
              onClick={() => setViewMode('card')}
              startIcon={<ViewModuleIcon />}
              variant={viewMode === 'card' ? 'contained' : 'outlined'}
             />
            <Button
              onClick={() => setViewMode('list')}
              startIcon={<ViewListIcon />}
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
             />
          </ButtonGroup>
        </div>

        {filteredPlatforms.length === 0 ? (
          <Typography variant="h6" color="textSecondary" align="center" style={{ marginTop: 32 }}>
            {searchTerm ? 
              `No platforms found matching "${searchTerm}"` :
              'No platforms found. Make sure the target platforms (SPAship, SSR-Platform, Droperator, Lightrail) are registered in your Backstage catalog.'
            }
          </Typography>
        ) : (
          <>
            {viewMode === 'card' ? (
              <PlatformCardView platforms={filteredPlatforms} />
            ) : (
              <PlatformListView platforms={filteredPlatforms} />
            )}
          </>
        )}
      </Content>
    </Page>
  );
};
