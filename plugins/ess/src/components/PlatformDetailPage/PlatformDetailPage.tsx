import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Page,
  Header,
  Content,
  Progress,
  ResponseErrorPanel,
  Link,
  TabbedLayout,
  InfoCard,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { EntityPeekAheadPopover, catalogApiRef } from '@backstage/plugin-catalog-react';
import { DEFAULT_NAMESPACE } from '@backstage/catalog-model';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import {
  Typography,
  Grid,
  Button,
  Chip,
  TextField,
  InputAdornment,
  makeStyles,
  Box,
  CardActions,
  Divider,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import LinkIcon from '@material-ui/icons/Link';
import SearchIcon from '@material-ui/icons/Search';
import LaunchIcon from '@material-ui/icons/Launch';
import PersonIcon from '@material-ui/icons/Person';
import { usePlatform } from '../../hooks/usePlatforms';
import { SecurityRequirementsCards } from '../SecurityRequirementsCards';
import type { SecurityRequirementsData } from '../SecurityRequirementsCards';
import { loadPlatformEssData, getPlatformDocumentationUrl, getPlatformCatalogUrl, createGitLabConfigFromAppConfig } from '../../data/essDataLoader';


const useStyles = makeStyles(theme => ({
  searchContainer: {
    marginBottom: theme.spacing(3),
  },
  searchField: {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.spacing(1),
    },
  },
  leftColumn: {
    paddingRight: theme.spacing(2),
  },
  rightColumn: {
    paddingLeft: theme.spacing(2),
  },
  cardContent: {
    padding: '16px',
  },
  cardActions: {
    justifyContent: 'flex-start',
    padding: theme.spacing(2),
    borderTop: 'none',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: theme.spacing(1),
  },
  linkButton: {
    textTransform: 'none',
    justifyContent: 'flex-start',
    padding: theme.spacing(1, 2),
    borderRadius: theme.spacing(1),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  linkIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  rightSideContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
  },
  subheaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: theme.spacing(1),
  },
  subheaderText: {
    fontSize: '0.8rem',
    flex: '1 1 auto',
    minWidth: 0,
  },
  chipContainer: {
    flex: '0 0 auto',
  },
  catalogContent: {
    padding: theme.spacing(2),
  },
  catalogSection: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  catalogSectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  catalogChips: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(1),
  },
  catalogChip: {
    fontSize: '0.65rem',
    height: '22px',
  },
  ownerItem: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
  },
  headerAction: {
    '& .MuiIconButton-root': {
      padding: theme.spacing(0.5),
    },
  },
}));

export const PlatformDetailPage = () => {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [essData, setEssData] = useState<SecurityRequirementsData | null>(null);
  const [essLoading, setEssLoading] = useState(false);
  const [relatedApps, setRelatedApps] = useState<Array<{dependency: string; entity?: any; status: 'found' | 'not_found' | 'error'}>>([]);
  const [relatedAppsLoading, setRelatedAppsLoading] = useState(false);
  const [relatedAppsSearch, setRelatedAppsSearch] = useState('');
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name || '');
  const { platform, loading, error } = usePlatform(decodedName);
  const catalogApi = useApi(catalogApiRef);
  const configApi = useApi(configApiRef);

  // Helper function to get catalog chips from platform metadata
  const getCatalogChips = () => {
    if (!platform) return [];

    const chips = [];

    // Add namespace chip (grey color)
    if (platform.namespace) {
      chips.push({ label: platform.namespace, color: 'default' as const });
    }

    // Add kind chip (grey color, but exclude platform kind)
    if (platform.kind && platform.kind.toLowerCase() !== 'platform') {
      chips.push({ label: platform.kind, color: 'default' as const });
    }

    // Add tags from metadata (grey color, filter out ESS and platform tags)
    if (platform.metadata?.tags && Array.isArray(platform.metadata.tags)) {
      const filteredTags = platform.metadata.tags.filter((tag: string) => 
        tag.toLowerCase() !== 'ess' && 
        tag.toLowerCase() !== 'platform' &&
        tag.toLowerCase() !== 'catalog'
      );
      
      const remainingSlots = 5 - chips.length;
      filteredTags.slice(0, remainingSlots).forEach((tag: string) => {
        chips.push({ label: tag, color: 'default' as const });
      });
    }

    // Skip system chips as requested
    // Skip ESS and CATALOG chips as requested

    return chips.slice(0, 5); // Limit to 5 chips
  };

  // Helper function to get owners
  const getOwners = () => {
    if (!platform) return [];

    const owners = [];

    // Check for owner in root level
    if (platform.owner) {
      owners.push(platform.owner);
    }

    // Check for owners in metadata
    if (platform.metadata?.owner) {
      owners.push(platform.metadata.owner);
    }

    // Check for owners in spec
    if (platform.spec?.owner) {
      owners.push(platform.spec.owner);
    }

    // Remove duplicates
    return [...new Set(owners)];
  };

  // Helper function to render owner with hover functionality
  const renderOwner = (owner: string) => {
    // Check if this looks like a group reference (format: group:namespace/groupname, group:groupname, or namespace/groupname)
    const isGroupRef = owner.startsWith('group:') || 
                      (owner.includes('/') && !owner.startsWith('user:')) ||
                      owner.includes('-devs') || // Common pattern for dev groups
                      owner.includes('-team');   // Common pattern for team groups
    
    if (isGroupRef) {
      // Parse the owner string to get proper entityRef format
      let entityRef = owner;
      
      if (owner.startsWith('group:')) {
        // Already in correct format
        entityRef = owner;
      } else if (owner.includes('/')) {
        // Format: "namespace/groupname" -> "group:namespace/groupname"
        entityRef = `group:${owner}`;
      } else {
        // Format: just "groupname" -> "group:default/groupname"
        entityRef = `group:${DEFAULT_NAMESPACE}/${owner}`;
      }
      
      // Extract display name (remove group: prefix for cleaner display)
      const displayName = owner.startsWith('group:') ? owner.substring(6) : owner;
      
      return (
        <EntityPeekAheadPopover entityRef={entityRef}>
          <Chip
            variant="outlined"
            label={displayName}
            size="small"
            color="primary"
            style={{ cursor: 'pointer' }}
          />
        </EntityPeekAheadPopover>
      );
    }

    // For non-group owners, render as regular chip
    return (
      <Chip
        variant="outlined"
        label={owner}
        size="small"
        color="default"
      />
    );
  };

  // Overview content component
  const renderOverviewContent = () => {
    if (essLoading) {
      return (
        <Progress />
      );
    }
    
    if (essData) {
      return (
        <Grid container spacing={3}>
          {/* Left Column - ESS Details Card (60%) */}
          <Grid item xs={12} md={7} className={classes.leftColumn}>
            <InfoCard
              title="ESS Security Requirements"
              noPadding
              variant="gridItem"
              subheader={
                <Box className={classes.subheaderContainer}>
                  <Typography variant="body2" color="textSecondary" className={classes.subheaderText}>
                    Enterprise Security Standards compliance requirements and responses
                  </Typography>
                </Box>
              }
            >
              <Box className={classes.cardContent}>
                {/* Search Bar within the left card */}
                <Box className={classes.searchContainer}>
                  <TextField
                    className={classes.searchField}
                    placeholder="Search ESS requirements by ID, description, or response..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Divider />
                <Box style={{ padding: '16px 0' }}>
                  <SecurityRequirementsCards
                    data={essData}
                    searchTerm={searchTerm}
                  />
                </Box>
              </Box>
            </InfoCard>
          </Grid>

          {/* Right Column - Resources (40%) */}
          <Grid item xs={12} md={5} className={classes.rightColumn}>
            <Box className={classes.rightSideContainer}>
              {/* Documentation Card */}
              <Box style={{ marginBottom: 16 }}>
                <InfoCard
                  title="Documentation"
                  noPadding
                  variant="gridItem"
                  subheader={
                    <Box className={classes.subheaderContainer}>
                      <Typography variant="body2" color="textSecondary" className={classes.subheaderText}>
                        Access ESS documentation and compliance resources
                      </Typography>
                    </Box>
                  }
                >
                  <CardActions className={classes.cardActions}>
                    <Button
                      className={classes.linkButton}
                      startIcon={<LinkIcon className={classes.linkIcon} fontSize="small" />}
                      component="a"
                      href={getPlatformDocumentationUrl(platform!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                    >
                      <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                        {platform!.name} ESS Documentation
                      </Typography>
                    </Button>
                    <Button
                      className={classes.linkButton}
                      startIcon={<LinkIcon className={classes.linkIcon} fontSize="small" />}
                      component="a"
                      href="https://source.redhat.com/departments/it/it_information_security/wiki/enterprise_security_standard_80_essv8"
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                    >
                      <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
                        Enterprise Security Standard (ESS v10)
                      </Typography>
                    </Button>
                  </CardActions>
                </InfoCard>
              </Box>

              {/* Catalog Details Card */}
              <InfoCard
                title={
                  <Link 
                    to={getPlatformCatalogUrl(platform!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    Catalog Details
                  </Link>
                }
                noPadding
                variant="gridItem"
                subheader={
                  <Box className={classes.subheaderContainer}>
                    <Typography variant="body2" color="textSecondary" className={classes.subheaderText}>
                      Platform specifications and metadata
                    </Typography>
                  </Box>
                }
                headerProps={{
                  classes: { action: classes.headerAction },
                  action: (
                    <Tooltip title="View in Catalog">
                      <IconButton
                        component="a"
                        href={getPlatformCatalogUrl(platform!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                        size="small"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              >
                <Box className={classes.catalogContent}>
                  {/* Platform Tags/Labels Section */}
                  {getCatalogChips().length > 0 && (
                    <Box className={classes.catalogSection}>
                      <Box className={classes.catalogChips}>
                        {getCatalogChips().map((chip, index) => (
                          <Chip
                            key={index}
                            label={chip.label}
                            size="small"
                            color={chip.color}
                            variant="outlined"
                            className={classes.catalogChip}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Owners Section */}
                  {getOwners().length > 0 && (
                    <Box className={classes.catalogSection}>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <PersonIcon fontSize="small" color="action" />
                        {getOwners().map((owner, index) => (
                          <Box key={index}>
                            {renderOwner(owner)}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Add a fallback message if no data */}
                  {getCatalogChips().length === 0 && getOwners().length === 0 && (
                    <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
                      No additional catalog details available
                    </Typography>
                  )}
                </Box>
              </InfoCard>
            </Box>
          </Grid>
        </Grid>
      );
    }
    
    return (
      <Typography variant="body1" color="textSecondary" style={{ textAlign: 'center', padding: '2rem' }}>
        ESS compliance data is not available for {platform!.name}.
      </Typography>
    );
  };

  // Related Applications content component
  const renderRelatedApplicationsContent = () => {
    if (relatedAppsLoading) {
      return (
        <Progress />
      );
    }

    if (relatedApps.length === 0) {
      return (
        <Typography variant="body1" color="textSecondary" style={{ textAlign: 'center', padding: '2rem' }}>
          No related applications found
        </Typography>
      );
    }

    // Define table columns - only show requested fields
    const columns: TableColumn[] = [
      {
        title: 'Dependency Reference',
        field: 'dependency',
        render: (rowData: any) => (
          <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {rowData.dependency}
          </Typography>
        ),
      },
      {
        title: 'Name',
        field: 'name',
        render: (rowData: any) => (
          rowData.entity ? (
            <Link
              to={`/catalog/${rowData.entity.metadata.namespace || DEFAULT_NAMESPACE}/${rowData.entity.kind}/${rowData.entity.metadata.name}`}
            >
              <Typography variant="body2" style={{ fontWeight: 500, color: 'inherit', textDecoration: 'none' }}>
                {rowData.entity.metadata.title || rowData.entity.metadata.name}
              </Typography>
            </Link>
          ) : (
            <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
              Not found in catalog
            </Typography>
          )
        ),
      },
      {
        title: 'Status',
        field: 'status',
        render: (rowData: any) => (
          <Chip
            label={(() => {
              if (rowData.status === 'found') return 'Found';
              if (rowData.status === 'not_found') return 'Not Found';
              return 'Error';
            })()}
            size="small"
            color={rowData.status === 'found' ? 'primary' : 'default'}
            variant={rowData.status === 'found' ? 'default' : 'outlined'}
          />
        ),
      },
      {
        title: 'Owner',
        field: 'owner',
        render: (rowData: any) => (
          rowData.entity?.spec?.owner ? (
            renderOwner(rowData.entity.spec.owner)
          ) : (
            <Typography variant="body2" color="textSecondary">-</Typography>
          )
        ),
      },
      {
        title: 'Kind',
        field: 'kind',
        render: (rowData: any) => (
          rowData.entity ? (
            <Chip label={rowData.entity.kind} size="small" color="primary" variant="outlined" />
          ) : (
            <Typography variant="body2" color="textSecondary">-</Typography>
          )
        ),
      },
    ];

    // Prepare table data with search filtering
    const tableData = relatedApps.filter((app: {dependency: string; entity?: any; status: 'found' | 'not_found' | 'error'}) => {
      if (!relatedAppsSearch.trim()) return true;
      
      const searchLower = relatedAppsSearch.toLowerCase();
      const entityName = app.entity?.metadata.title || app.entity?.metadata.name || '';
      const entityDescription = app.entity?.metadata.description || '';
      const entityKind = app.entity?.kind || '';
      const entityNamespace = app.entity?.metadata.namespace || '';
      const entityOwner = app.entity?.spec?.owner || '';
      
      return (
        app.dependency.toLowerCase().includes(searchLower) ||
        entityName.toLowerCase().includes(searchLower) ||
        entityDescription.toLowerCase().includes(searchLower) ||
        entityKind.toLowerCase().includes(searchLower) ||
        entityNamespace.toLowerCase().includes(searchLower) ||
        entityOwner.toLowerCase().includes(searchLower)
      );
    });

    return (
      <Table
        title={`Related Applications (${tableData.length})`}
        options={{
          search: true,
          searchText: relatedAppsSearch,
          paging: true,
          pageSize: 10,
          pageSizeOptions: [5, 10, 20, 50],
          emptyRowsWhenPaging: false,
          searchFieldVariant: 'outlined',
          searchFieldStyle: { width: '100%' },
          padding: 'dense',
          toolbar: true,
          header: true,
        }}
        columns={columns}
        data={tableData}
        onSearchChange={(searchValue) => setRelatedAppsSearch(searchValue)}
      />
    );
  };

  // Load ESS data when platform changes
  useEffect(() => {
    if (platform) {
      setEssLoading(true);
      
      // Create GitLab configuration from app config
      const gitlabConfig = createGitLabConfigFromAppConfig(configApi);
      
      // Use the platform name (which is metadata.name) directly for GitLab API calls
      const platformFileName = platform.name; // This is entity.metadata.name
      
      loadPlatformEssData(platformFileName, gitlabConfig)
        .then(data => {
          setEssData(data);
        })
        .catch(() => {
          // Failed to load ESS data, set to null
          setEssData(null);
        })
        .finally(() => {
          setEssLoading(false);
        });
    }
  }, [platform, configApi]);

  // Load related applications when platform changes
  useEffect(() => {
    if (platform?.spec?.dependsOn && Array.isArray(platform.spec?.dependsOn)) {
      setRelatedAppsLoading(true);
      
      // Fetch all related applications
      const fetchRelatedApps = async () => {
        try {
          const apps: Array<{dependency: string; entity?: any; status: 'found' | 'not_found' | 'error'}> = [];
          
          for (const dependency of platform.spec?.dependsOn || []) {
            try {
              // Parse the dependency string (e.g., "component:compass/compass-platform")
              let entityRef = dependency;
              if (typeof dependency === 'string') {
                // If it doesn't start with kind:, assume it's a component
                if (!dependency.includes(':')) {
                  entityRef = `component:${dependency}`;
                }
              }
              
              // Fetching dependency
              
              // Fetch the entity from catalog
              try {
                const entity = await catalogApi.getEntityByRef(entityRef);
                if (entity) {
                  apps.push({ dependency, entity, status: 'found' });
                  // Found entity
                } else {
                  apps.push({ dependency, entity: undefined, status: 'not_found' });
                  // Entity not found
                }
              } catch (fetchError) {
                apps.push({ dependency, entity: undefined, status: 'not_found' });
                // Failed to fetch dependency
              }
            } catch (processingError) {
              apps.push({ dependency, entity: undefined, status: 'error' });
              // Error processing dependency
            }
          }
          
          // Final related apps processed
          setRelatedApps(apps);
        } catch (fetchError) {
          // Failed to fetch related applications
          setRelatedApps([]);
        } finally {
          setRelatedAppsLoading(false);
        }
      };
      
      fetchRelatedApps();
    } else {
      // No dependsOn found or not an array
      setRelatedApps([]);
      setRelatedAppsLoading(false);
    }
  }, [platform, catalogApi]);

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (!platform) {
    return (
      <Page themeId="tool">
        <Header title="Platform Not Found" />
        <Content>
          <Typography>Platform "{decodedName}" not found.</Typography>
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header title={platform.name} subtitle={platform.description}>
        <Link to="/compliance/ess">
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to Platforms
          </Button>
        </Link>
      </Header>
      <TabbedLayout>
        <TabbedLayout.Route path="" title="Overview">
          <Content>
            {renderOverviewContent()}
          </Content>
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/related-applications" title="Related Applications">
          <Content>
            {renderRelatedApplicationsContent()}
          </Content>
        </TabbedLayout.Route>
      </TabbedLayout>
    </Page>
  );
};
