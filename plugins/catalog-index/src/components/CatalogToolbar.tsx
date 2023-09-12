import React from 'react';
import {
  EntityKindPicker,
  EntitySearchBar,
  EntityTypePicker,
} from '@backstage/plugin-catalog-react';
import { Box, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  container: {
    gap: theme.spacing(1),
  },
  textLabel: {
    fontWeight: 'bold',
  },
}));

interface CatalogToolbarProps {
  children?: React.ReactNode;
}

export const CatalogToolbar = ({ children }: CatalogToolbarProps) => {
  const { container, textLabel } = useStyles();

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      className={container}
    >
      <Box
        alignSelf="flex-end"
        display="flex"
        marginBottom="0.75rem"
        flexDirection="column"
      >
        <Typography variant="body2" component="label" className={textLabel}>
          Search
        </Typography>
        <EntitySearchBar />
      </Box>
      <EntityKindPicker />
      <Box alignSelf="flex-end" marginBottom={1}>
        <EntityTypePicker />
      </Box>

      {children}
    </Box>
  );
};
