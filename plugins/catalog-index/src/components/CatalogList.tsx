import React, { useEffect } from 'react';
import { CatalogItem } from './CatalogItem';
import { Button, List, Paper, makeStyles } from '@material-ui/core';
import { useEntityList } from '@backstage/plugin-catalog-react';
import { EmptyState, Link, Progress } from '@backstage/core-components';

const useStyles = makeStyles(theme => ({
  list: {
    '&>*:nth-child(even)': {
      backgroundColor: theme.palette.background.default,
    },
  }
}))

interface CatalogListProps {
  dispatchActiveKind?: (values: { kind: string; count: number }) => void;
}

export const CatalogList = ({ dispatchActiveKind }: CatalogListProps) => {
  const { loading, error, entities, filters } = useEntityList();
  const { list } = useStyles();

  useEffect(() => {
    if (filters.kind?.value) {
      dispatchActiveKind?.({
        kind: filters.kind?.value,
        count: entities.length,
      });
    }
  }, [dispatchActiveKind, entities, filters]);

  const EntitiesList = () => {
    if (entities.length === 0) {
      return (
        <Paper variant="outlined">
          <EmptyState
            missing="data"
            title={`No ${filters.kind?.value}s found.`}
            description="No records found for the entered filters."
            action={
              <Button
                color="primary"
                variant="outlined"
                component={props => <Link {...props} to="/" />}
              >
                Go to home
              </Button>
            }
          />
        </Paper>
      );
    }
    return (
      <Paper>
        <List className={list}>
          {entities.map(entity => (
            <CatalogItem key={entity.metadata.name} entity={entity} />
          ))}
        </List>
      </Paper>
    );
  };

  return (
    <>
      {loading && <Progress />}
      {!loading && !error && <EntitiesList />}
    </>
  );
};
