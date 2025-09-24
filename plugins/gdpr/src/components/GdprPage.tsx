import { useState, ChangeEvent, FormEvent } from 'react';
import {
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  InfoCard,
  Header,
  Page,
  Content,
  HeaderLabel
} from '@backstage/core-components';
import { gdprApiRef } from '../api';
import { PDRStatusComponent } from './PDRStatusComponent';
import { GdprSearchComponent } from './GdprSearchComponent';
import { useApi, alertApiRef } from '@backstage/core-plugin-api';
import { GdprTableData } from '../types';
import { Progress } from '@backstage/core-components';
import { useGdprAccess } from '../hooks/useGdprAccess';
import { AccessDenied } from './AccessDenied';

const useStyles = makeStyles(theme => ({
  cardTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  systemSelector: {
    minWidth: 200,
    [theme.breakpoints.down('sm')]: {
      minWidth: '100%',
      marginTop: theme.spacing(1),
    },
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      width: '100%',
      '& button': {
        width: '100%',
      },
    },
  },
  loadingContainer: {
    marginTop: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: theme.spacing(1),
    },
  },
  loadingText: {
    marginLeft: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      textAlign: 'center',
    },
  },
  tabContent: {
    marginTop: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(2),
    },
  },
  searchResultsContainer: {
    marginTop: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(2),
    },
  },
  formContainer: {
    [theme.breakpoints.down('sm')]: {
      '& .MuiGrid-item': {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
      },
    },
  },
  searchFormSection: {
    marginBottom: theme.spacing(3),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
      marginBottom: theme.spacing(2),
    },
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
    color: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    '&::before': {
      content: '""',
      width: 4,
      height: 24,
      backgroundColor: theme.palette.primary.main,
      marginRight: theme.spacing(1),
      borderRadius: 2,
    },
  },
  formFieldRow: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1),
    },
  },
  requiredIndicator: {
    color: theme.palette.error.main,
    marginLeft: theme.spacing(0.5),
  },
  fieldHelperText: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },

}));


export const GdprComponent = () => {
  const classes = useStyles();
  
  // Access control check
  const { hasAccess, loading: accessLoading, error: accessError, userInfo } = useGdprAccess();
  
  // Tab state management
  const [tabIndex, setTabIndex] = useState(0);
  const [searchType, setSearchType] = useState('All System'); // Default selection

  const gdprApi = useApi(gdprApiRef);
  const alertApi = useApi(alertApiRef);

  // Loading state
  const [isSearching, setIsSearching] = useState(false);

  // State management for form fields
  const [form, setForm] = useState({
    email: '',
    ssoUsername: '',
    accountNumber: '',
    firstName: '',
    lastName: '',
    ticketId: '',
    drupalUsername: '',
    drupalUid: '',
    ssoId: ''
  });

  // Handle tab change
  const handleTabChange = (_event: ChangeEvent<{}>, newIndex: number) => {
    setTabIndex(newIndex);
  };
  const [searchResults, setSearchResults] = useState<GdprTableData[]>([]); // Store search results

  // Handle dropdown change
  const handleSearchTypeChange = (event: ChangeEvent<{ value: unknown }>) => {
    setSearchType(event.target.value as string);
    setForm({
      email: '',
      ssoUsername: '',
      accountNumber: '',
      firstName: '',
      lastName: '',
      ticketId: '',
      drupalUsername: '',
      drupalUid: '',
      ssoId: ''
    });
  };

  // Handle input changes
  const updateForm = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  // Handle form submission
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (searchType === "All System") {
      // TODO: Implement all system search functionality
      alertApi.post({
        message: "All System search is not yet implemented.",
        severity: 'info',
        display: 'transient'
      });
      return;
    }

    if (!form.drupalUsername.trim()) {
      alertApi.post({
        message: "Please enter a Drupal username to search.",
        severity: 'warning',
        display: 'transient'
      });
      return;
    }

    if (!form.email.trim()) {
      alertApi.post({
        message: "Please enter an email address to search.",
        severity: 'warning',
        display: 'transient'
      });
      return;
    }
    
    setIsSearching(true);
    try {
      const fetchedIncidents = await gdprApi.fetchDrupalGdprData(form.drupalUsername, form.email);
      setSearchResults(fetchedIncidents);
      
      alertApi.post({
        message: `Found ${fetchedIncidents.length} records for user "${form.drupalUsername}".`,
        severity: 'success',
        display: 'transient'
      });
    } catch (error) {
      // Handle error appropriately
      setSearchResults([]);
      alertApi.post({
        message: `No data found for user "${form.drupalUsername}".`,
        severity: 'info',
        display: 'transient'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Reset Form
  const resetForm = () => {
    setForm({
      email: '',
      ssoUsername: '',
      accountNumber: '',
      firstName: '',
      lastName: '',
      ticketId: '',
      drupalUsername: '',
      drupalUid: '',
      ssoId: ''
    });
  };

  // Access control: Show loading state while checking access
  if (accessLoading) {
    return (
      <Page themeId="tool">
        <Header title="GDPR Automation" subtitle="AppDev x GDPR">
          <HeaderLabel label="Owner" value="AppDev" />
          <HeaderLabel label="Lifecycle" value="Alpha" />
        </Header>
        <Content>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Box textAlign="center">
              <Progress />
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
                Verifying access permissions...
              </Typography>
            </Box>
          </Box>
        </Content>
      </Page>
    );
  }

  // Access control: Show access denied if user doesn't have permission
  if (!hasAccess) {
    return <AccessDenied error={accessError} userInfo={userInfo} />;
  }

  return (
    <Page themeId="tool">
      <Header title="GDPR Automation" subtitle="AppDev x GDPR">
        <HeaderLabel label="Owner" value="AppDev" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        {/* Tabs for switching between Search and PDR Status */}
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Search" />
          <Tab label="PDR Status" />
        </Tabs>

        {/* Tab Content */}
        <Box className={classes.tabContent}>
          {tabIndex === 0 && (
            <Grid container spacing={3} direction="column">
              <Grid item>
                <InfoCard
                  title={
                    <div className={classes.cardTitleContainer}>
                      <span>Search Data</span>
                      <FormControl variant="outlined" size="small" className={classes.systemSelector}>
                        <InputLabel>Select System</InputLabel>
                        <Select value={searchType} onChange={handleSearchTypeChange}>
                          <MenuItem value="All System">All System</MenuItem>
                          <MenuItem value="Drupal">Drupal</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  }
                >
                  <form onSubmit={onSubmit}>
                    <Grid container spacing={2} className={classes.formContainer}>
                      {/* Search Type Dropdown */}


                      {/* Conditional Fields Based on Search Type */}
                      {searchType === "All System" ? (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" className={classes.sectionTitle}>
                              User Information
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="Email Address"
                              name="email"
                              type="email"
                              variant="outlined"
                              size="small"
                              value={form.email}
                              onChange={updateForm}
                              required
                              helperText="Primary email address associated with the user account"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="SSO Username"
                              name="ssoUsername"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.ssoUsername}
                              onChange={updateForm}
                              required
                              helperText="Single Sign-On username (login name)"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="Account Number"
                              name="accountNumber"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.accountNumber}
                              onChange={updateForm}
                              required
                              helperText="Account number"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="ServiceNow Ticket"
                              name="ticketId"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.ticketId}
                              onChange={updateForm}
                              required
                              helperText="ServiceNow ticket number for this request"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" className={classes.sectionTitle}>
                              Personal Details
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="First Name"
                              name="firstName"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.firstName}
                              onChange={updateForm}
                              required
                              helperText="User's first name"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="Last Name"
                              name="lastName"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.lastName}
                              onChange={updateForm}
                              required
                              helperText="User's last name"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                        </>
                      ) : (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" className={classes.sectionTitle}>
                              Search Criteria
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="ServiceNow Ticket Number"
                              name="ticketId"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.ticketId}
                              onChange={updateForm}
                              required
                              helperText="Required: ServiceNow ticket number for this GDPR request"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="Drupal Username"
                              name="drupalUsername"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.drupalUsername}
                              onChange={updateForm}
                              helperText="Drupal-specific username (leave empty to search by other criteria)"
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" className={classes.sectionTitle}>
                              Additional Identifiers
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="Email Address"
                              name="email"
                              type="email"
                              variant="outlined"
                              size="small"
                              value={form.email}
                              onChange={updateForm}
                              required
                              helperText="User's email address"
                              InputLabelProps={{ 
                                required: true,
                                classes: { asterisk: classes.requiredIndicator }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="Drupal User ID"
                              name="drupalUid"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.drupalUid}
                              onChange={updateForm}
                              helperText="Numeric user ID in Drupal system"
                            />
                          </Grid>
                          <Grid item xs={12} md={6} className={classes.formFieldRow}>
                            <TextField
                              fullWidth
                              label="SSO Identifier"
                              name="ssoId"
                              type="text"
                              variant="outlined"
                              size="small"
                              value={form.ssoId}
                              onChange={updateForm}
                              helperText="Single Sign-On identifier"
                            />
                          </Grid>
                        </>
                      )}

                      {/* Buttons */}
                      <Grid item xs={12}>
                        <Box className={classes.buttonContainer}>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            type="submit"
                            disabled={isSearching}
                          >
                            {isSearching ? 'Searching...' : 'Search'}
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="secondary" 
                            onClick={resetForm}
                            disabled={isSearching}
                          >
                            Reset
                          </Button>
                        </Box>
                        
                        {/* Loading indicator */}
                        {isSearching && (
                          <Grid item xs={12}>
                            <Box className={classes.loadingContainer}>
                              <Progress />
                              <Typography 
                                variant="body2" 
                                color="textSecondary"
                                className={classes.loadingText}
                              >
                                Searching for GDPR data...
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  </form>
                </InfoCard>
              </Grid>
            </Grid>
          )}

          {/* PDR Status Tab */}
          {tabIndex === 1 && <PDRStatusComponent />}
        </Box>

        <Box className={classes.searchResultsContainer}>
          {/* Search Results Table */}
          {tabIndex === 0 && (
            <GdprSearchComponent 
              searchType={searchType} 
              searchResults={searchResults} 
              onSearchResultsChange={setSearchResults}
              isLoading={isSearching}
            />
          )}
        </Box>
      </Content>
    </Page>
  );
};
