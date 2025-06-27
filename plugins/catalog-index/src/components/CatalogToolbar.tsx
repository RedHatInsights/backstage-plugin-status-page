import { Box, Typography, makeStyles } from '@material-ui/core';
import { EntityKindPicker } from './EntityKindPicker';
import { EntityTypePicker } from './EntityTypePicker';
import { EntitySearchBar } from './EntitySearchBar';

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
      <Box alignSelf="flex-end" display="flex" flexDirection="column">
        <Typography variant="body2" component="label" className={textLabel}>
          Search
        </Typography>
        <EntitySearchBar />
      </Box>
      <EntityKindPicker />
      <EntityTypePicker />

      {children}
    </Box>
  );
};
