import { Link } from '@backstage/core-components';
import {
  alertApiRef,
  discoveryApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { CircularProgress } from '@material-ui/core';
import Drawer from '@material-ui/core/Drawer';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';

const useStyles = makeStyles(theme => ({
  box: {
    padding: theme.spacing(2),
    margin: theme.spacing(2),
    minHeight: 200,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
  tag: {
    backgroundColor: '#e0f2f1',
    color: '#00796b',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'inline-block',
    marginBottom: '8px',
    marginTop: '4px',
    width: 'fit-content',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
  },
  actionLink: {
    cursor: 'pointer',
    color: theme.palette.primary.main,
    textDecoration: 'underline',
  },
  drawerContent: {
    width: 300,
    padding: theme.spacing(3),
  },
  closeLink: {
    marginTop: theme.spacing(2),
    cursor: 'pointer',
    color: theme.palette.error.main,
    textDecoration: 'underline',
  },
  viewButton: {
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
  },
}));

export const RegistryComponent = () => {
  const classes = useStyles();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardsData, setCardsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  useEffect(() => {
    const fetchCatalog = async () => {
      const data = await discoveryApi.getBaseUrl('proxy');
      try {
        const response = await fetch(`${data}/mcp/raw`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const jsonData = await response.json();
        const parsedData = jsonData;
        const cards = Object.entries(parsedData).map(([id, value]: any) => ({
          id,
          name: value.name,
          maintainers: value.maintainers,
          description: value.description,
          gitUrl: value.url,
          documentation: value.documentation,
          readme: value.readme,
          tag:
            typeof value.tags === 'string'
              ? value.tags.split(',').map((tag: string) => tag.trim())
              : [],
          npmId: value.npmId,
          dockerId: value.dockerId,
          version: value.version,
          changelog: value.changelog,
          offer: value.offer,
          status: value.status,
        }));

        setCardsData(cards);
        setLoading(false);
      } catch (err: any) {
        alertApi.post({
          message: 'Failed to load the registry data.',
          severity: 'error',
        });
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [alertApi, discoveryApi]);

  if (loading) {
    return (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <CircularProgress />
        </div>
      </>
    );
  }

  const handleView = (card: any) => {
    setSelectedCard(card);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCard(null);
  };

  return (
    <>
      <Grid container alignItems="center" spacing={2}>
        {cardsData.map(el => (
          <Grid item key={el.id} xs={12} sm={6} md={4}>
            <div className={classes.box}>
              <Typography variant="h6" gutterBottom>
                {el.name}
              </Typography>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                {` ${el.id}`}
              </Typography>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                {`Maintainer: ${el.maintainers}`}
              </Typography>
              <Typography variant="body2">
                {el.description.length > 120
                  ? `${el.description.slice(0, 120)}...`
                  : el.description}
              </Typography>
              <div className={classes.actions}>
                <button
                  className={classes.viewButton}
                  onClick={() => handleView(el)}
                >
                  View
                </button>
                {el.learnMore && (
                  <Link to={el.learnMore} className={classes.actionLink}>
                    Learn More
                  </Link>
                )}
              </div>
            </div>
          </Grid>
        ))}
      </Grid>
      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}>
        <div
          className={classes.drawerContent}
          style={{
            padding: '24px',
            minWidth: '400px',
            backgroundColor: '#f4f6f8',
            borderLeft: '4px solid #3f51b5',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto',
          }}
        >
          {selectedCard && (
            <>
              <Typography
                variant="h6"
                gutterBottom
                style={{ fontWeight: 600, marginBottom: '12px' }}
              >
                {selectedCard.name}
              </Typography>

              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                <strong>Maintainers:</strong> {selectedCard.maintainers}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Description:</strong> {selectedCard.description}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Git URL:</strong>{' '}
                <a
                  href={selectedCard.gitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginRight: '20px',
                    color: '#3f51b5',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {selectedCard.gitUrl}
                </a>
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Documentation:</strong>{' '}
                <a
                  href={selectedCard.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#3f51b5',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {selectedCard.documentation}
                </a>
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Readme:</strong>{' '}
                {selectedCard.readme || 'No readme available'}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Tags:</strong>{' '}
                {selectedCard.tag.join(', ') || 'No tags'}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>NPM ID:</strong> {selectedCard.npmId || 'Not available'}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Docker ID:</strong>{' '}
                {selectedCard.dockerId || 'Not available'}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Version:</strong> {selectedCard.version}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Changelog:</strong>{' '}
                {selectedCard.changelog || 'No changelog available'}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Offer:</strong>{' '}
                {selectedCard.offer || 'No offer available'}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> {selectedCard.status}
              </Typography>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
};
