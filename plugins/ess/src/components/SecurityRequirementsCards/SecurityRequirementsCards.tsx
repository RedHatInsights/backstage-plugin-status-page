import { useState, useMemo } from 'react';
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  makeStyles,
  Box,
  Divider,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export interface SecurityRequirement {
  requirementId: string;
  description: string;
  response: string[];
}

export interface SecurityRequirementsData {
  [categoryName: string]: SecurityRequirement[];
}

interface SecurityRequirementsCardsProps {
  data: SecurityRequirementsData;
  searchTerm?: string;
}

const useStyles = makeStyles(theme => ({
  categorySection: {
    marginBottom: theme.spacing(3),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1, 0),
  },
  categoryTitle: {
    fontWeight: 600,
    fontSize: '1rem',
    color: theme.palette.text.primary,
  },
  categorySubtitle: {
    fontSize: '0.8125rem',
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(1),
  },
  requirementsContainer: {
    boxShadow: 'none',
    borderRadius: 0,
    overflow: 'hidden',
    border: `0.25px solid ${theme.palette.divider}`,
  },
  accordion: {
    border: `0.25px solid ${theme.palette.divider} !important`,
    borderRadius: 0,
    boxShadow: 'none !important',
    margin: 0,
    backgroundColor: theme.palette.background.paper,
    '&:before': {
      display: 'none',
    },
    '&:not(:first-child)': {
      borderTop: 'none !important',
    },
    '&:last-child': {
      borderRadius: 0,
    },
  },
  accordionSummary: {
    padding: theme.spacing(1.5, 2.5),
    minHeight: 'auto',
    borderBottom: `0.25px solid ${theme.palette.divider} !important`,
    '&.Mui-expanded': {
      minHeight: 'auto',
      borderBottom: `0.25px solid ${theme.palette.primary.light} !important`,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focusVisible': {
      backgroundColor: theme.palette.action.focus,
    },
  },
  accordionDetails: {
    padding: theme.spacing(2, 2.5),
    backgroundColor: theme.palette.background.default,
    flexDirection: 'column',
  },
  requirementHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  requirementInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flex: 1,
  },
  requirementId: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    fontWeight: 600,
    minWidth: 'fit-content',
  },
  requirementDescription: {
    fontWeight: 500,
    fontSize: '0.875rem',
    color: theme.palette.text.primary,
    flex: 1,
  },
  copyButton: {
    padding: theme.spacing(0.25),
    marginLeft: theme.spacing(0.5),
    opacity: 0.6,
    transition: 'opacity 0.2s ease',
    '&:hover': {
      opacity: 1,
      backgroundColor: theme.palette.action.hover,
    },
  },
  responseList: {
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
  responseItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1),
    fontSize: '0.8125rem',
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
    '&:before': {
      content: '"•"',
      color: theme.palette.primary.main,
      fontWeight: 'bold',
      width: '1em',
      marginRight: theme.spacing(1),
      flexShrink: 0,
    },
  },
  categoryChip: {
    height: 18,
    fontSize: '0.65rem',
    fontWeight: 600,
  },
  emptyState: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
  },
  noResultsState: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

// Generate display configuration for any category name
const getCategoryConfig = (categoryKey: string, requirementCount: number, _index: number) => {
  // Make all chips blue (primary color)
  return {
    title: categoryKey,
    subtitle: `${requirementCount} security requirements`,
    color: 'primary' as const,
  };
};

export const SecurityRequirementsCards: React.FC<SecurityRequirementsCardsProps> = ({ 
  data, 
  searchTerm = ''
}) => {
  const classes = useStyles();
  const [expandedPanels, setExpandedPanels] = useState<{ [key: string]: string | false }>({});
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);


  const handleAccordionChange = (category: string, panel: string) => (
    _event: React.ChangeEvent<{}>, 
    isExpanded: boolean
  ) => {
    setExpandedPanels(prev => ({
      ...prev,
      [category]: isExpanded ? panel : false,
    }));
  };

  const handleCopyRequirement = async (requirement: SecurityRequirement) => {
    const content = [
      `Requirement ID: ${requirement.requirementId}`,
      `Description: ${requirement.description}`,
      `Response:`,
      ...requirement.response.map((item, index) => `${index + 1}. ${item}`)
    ].join('\n');
    
    try {
      await navigator.clipboard.writeText(content);
      setCopySnackbarOpen(true);
    } catch {
      // Failed to copy text - silently ignore
    }
  };

  // Flatten all requirements for search
  const allRequirements = useMemo(() => {
    const flattened: Array<SecurityRequirement & { category: string }> = [];
    
    Object.entries(data).forEach(([categoryKey, requirements]) => {
      if (requirements && Array.isArray(requirements)) {
        requirements.forEach((req: SecurityRequirement) => {
          flattened.push({
            ...req,
            category: categoryKey
          });
        });
      }
    });
    
    return flattened;
  }, [data]);

  // Filter requirements based on search term
  const filteredRequirements = useMemo(() => {
    if (!searchTerm.trim()) {
      return allRequirements;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return allRequirements.filter(req =>
      req.requirementId.toLowerCase().includes(searchLower) ||
      req.description.toLowerCase().includes(searchLower) ||
      req.response.some(response => response.toLowerCase().includes(searchLower))
    );
  }, [allRequirements, searchTerm]);

  // Group filtered requirements back by category
  const filteredData = useMemo(() => {
    const grouped: SecurityRequirementsData = {};
    
    filteredRequirements.forEach(req => {
      const { category, ...requirement } = req;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(requirement);
    });
    
    return grouped;
  }, [filteredRequirements]);

  const renderRequirementSection = (
    categoryKey: string,
    requirements: SecurityRequirement[],
    index: number
  ) => {
    const config = getCategoryConfig(categoryKey, requirements.length, index);
    
    if (requirements.length === 0) {
      return null; // Don't render empty categories
    }
    
    return (
      <Box key={categoryKey} className={classes.categorySection}>
        {/* Category Header */}
        <Box className={classes.categoryHeader}>
          <Box display="flex" alignItems="center">
            <Typography className={classes.categoryTitle}>
              {config.title}
            </Typography>
            <Typography className={classes.categorySubtitle}>
              ({requirements.length} requirements)
            </Typography>
          </Box>
          <Chip 
            label={requirements.length}
            size="small"
            color={config.color}
            className={classes.categoryChip}
          />
        </Box>
        
        {/* Requirements */}
        <Box className={classes.requirementsContainer}>
          {requirements.map((requirement) => (
            <Box key={requirement.requirementId}>
              <Accordion
                expanded={expandedPanels[categoryKey] === requirement.requirementId}
                onChange={handleAccordionChange(categoryKey, requirement.requirementId)}
                className={classes.accordion}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  className={classes.accordionSummary}
                  aria-controls={`${requirement.requirementId}-content`}
                  id={`${requirement.requirementId}-header`}
                >
                  <div className={classes.requirementHeader}>
                    <div className={classes.requirementInfo}>
                      <Chip
                        label={requirement.requirementId}
                        size="small"
                        variant="outlined"
                        color={config.color}
                        className={classes.requirementId}
                      />
                      <Typography className={classes.requirementDescription}>
                        {requirement.description}
                      </Typography>
                    </div>
                    <Tooltip title="Copy requirement details">
                      <IconButton
                        className={classes.copyButton}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyRequirement(requirement);
                        }}
                      >
                        <FileCopyIcon style={{ fontSize: '14px' }} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </AccordionSummary>
                
                <AccordionDetails className={classes.accordionDetails}>
                  <ul className={classes.responseList}>
                    {requirement.response.map((responseItem, responseIndex) => (
                      <li key={responseIndex} className={classes.responseItem}>
                        {responseItem}
                      </li>
                    ))}
                  </ul>
                </AccordionDetails>
              </Accordion>
            </Box>
          ))}
        </Box>
        
        {/* Add divider between categories except for the last one */}
        {index < Object.keys(filteredData).length - 1 && (
          <Box style={{ margin: '24px 0' }}>
            <Divider />
          </Box>
        )}
      </Box>
    );
  };

  const hasResults = filteredRequirements.length > 0;

  return (
    <>
      {!hasResults && searchTerm.trim() ? (
        <Box className={classes.noResultsState}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No requirements found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No ESS requirements match your search "{searchTerm}". Try different keywords.
          </Typography>
        </Box>
      ) : (
        <Box>
          {Object.entries(filteredData).map(([categoryKey, requirements], index) => {
            return renderRequirementSection(categoryKey, requirements, index);
          })}
        </Box>
      )}

      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setCopySnackbarOpen(false)}
        message="Requirement details copied to clipboard"
      />
    </>
  );
};
