import React from 'react';
import { Box, Card, CardContent } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  skeletonCard: {
    marginBottom: theme.spacing(2),
    animation: 'pulse 1.5s ease-in-out infinite',
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.divider,
  },
  skeletonRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    gap: theme.spacing(1),
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
    '100%': {
      opacity: 1,
    },
  },
}));

interface SkeletonLoaderProps {
  variant: 'table' | 'form' | 'card' | 'search';
  rows?: number;
  animate?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  rows = 5,
}) => {
  const classes = useStyles();

  const renderTableSkeleton = () => (
    <Card className={classes.skeletonCard}>
      <CardContent>
        {/* Table Header */}
        <Box className={classes.skeletonRow} mb={2}>
          <Skeleton variant="rect" width={40} height={40} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="15%" height={20} />
        </Box>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <Box key={index} className={classes.skeletonRow}>
            <Skeleton variant="rect" width={24} height={24} />
            <Skeleton variant="text" width="15%" height={16} />
            <Skeleton variant="text" width="20%" height={16} />
            <Skeleton variant="text" width="15%" height={16} />
            <Skeleton variant="text" width="25%" height={16} />
            <Skeleton variant="rect" width={80} height={32} />
          </Box>
        ))}

        {/* Pagination */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Skeleton variant="text" width="30%" height={20} />
          <Box display="flex">
            <Skeleton variant="rect" width={32} height={32} />
            <Box ml={1}>
              <Skeleton variant="rect" width={32} height={32} />
            </Box>
            <Box ml={1}>
              <Skeleton variant="rect" width={32} height={32} />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderFormSkeleton = () => (
    <Card className={classes.skeletonCard}>
      <CardContent>
        <Skeleton variant="text" width="40%" height={28} style={{ marginBottom: 16 }} />
        
        {Array.from({ length: Math.ceil(rows / 2) }).map((_, rowIndex) => (
          <Box key={rowIndex} display="flex" mb={2}>
            <Box flex={1}>
              <Skeleton variant="text" width="30%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton variant="rect" width="100%" height={40} />
              <Skeleton variant="text" width="60%" height={12} style={{ marginTop: 4 }} />
            </Box>
            <Box flex={1} ml={2}>
              <Skeleton variant="text" width="25%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton variant="rect" width="100%" height={40} />
              <Skeleton variant="text" width="50%" height={12} style={{ marginTop: 4 }} />
            </Box>
          </Box>
        ))}

        <Box display="flex" justifyContent="center" mt={3}>
          <Skeleton variant="rect" width={100} height={36} />
          <Box ml={2}>
            <Skeleton variant="rect" width={80} height={36} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderCardSkeleton = () => (
    <Box>
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} className={classes.skeletonCard}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Skeleton variant="text" width="30%" height={24} />
              <Skeleton variant="rect" width={24} height={24} />
            </Box>
            
            <Skeleton variant="text" width="100%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton variant="text" width="80%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton variant="text" width="60%" height={16} style={{ marginBottom: 16 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex">
                <Skeleton variant="rect" width={60} height={20} />
                <Box ml={1}>
                  <Skeleton variant="rect" width={80} height={20} />
                </Box>
              </Box>
              <Skeleton variant="rect" width={24} height={24} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderSearchSkeleton = () => (
    <Card className={classes.skeletonCard}>
      <CardContent>
        {/* Search Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Skeleton variant="text" width="25%" height={28} />
          <Skeleton variant="rect" width={120} height={32} />
        </Box>

        {/* Search Form */}
        <Box mb={3}>
          <Skeleton variant="text" width="20%" height={20} style={{ marginBottom: 12 }} />
          <Box display="flex" mb={2}>
            <Skeleton variant="rect" width="100%" height={40} />
            <Box ml={2} width="100%">
              <Skeleton variant="rect" width="100%" height={40} />
            </Box>
          </Box>
          <Box display="flex" mb={2}>
            <Skeleton variant="rect" width="100%" height={40} />
            <Box ml={2} width="100%">
              <Skeleton variant="rect" width="100%" height={40} />
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="center">
          <Skeleton variant="rect" width={100} height={36} />
          <Box ml={2}>
            <Skeleton variant="rect" width={80} height={36} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  switch (variant) {
    case 'table':
      return renderTableSkeleton();
    case 'form':
      return renderFormSkeleton();
    case 'card':
      return renderCardSkeleton();
    case 'search':
      return renderSearchSkeleton();
    default:
      return renderCardSkeleton();
  }
};
