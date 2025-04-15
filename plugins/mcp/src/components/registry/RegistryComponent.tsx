import { Link } from '@backstage/core-components';
import {
  discoveryApiRef,
  useApi
} from '@backstage/core-plugin-api';
import Drawer from '@material-ui/core/Drawer';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import yaml from 'js-yaml';
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
  const [error, setError] = useState<string | null>(null);
  const discoveryApi = useApi(discoveryApiRef);
  useEffect(() => {
    const fetchCatalog = async () => {

      const data = await discoveryApi.getBaseUrl('proxy');
      try {
        const response = await fetch(
          `${data}/mcp`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const text = await response.text();
        const parsedData = yaml.load(text) as Record<string, {
          title: string;
          owner: string;
          description: string;
          gitUrl: string;
        }>;

        const cards = Object.entries(parsedData).map(([id, value]) => ({
          id,
          title: value.title,
          owner: value.owner,
          description: value.description,
          gitUrl: value.gitUrl,
          getStarted: value.gitUrl,
          learnMore: value.gitUrl,
          tag: []
        }));
        setCardsData(cards);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [discoveryApi]);


  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography>Error: {error}</Typography>;
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
          <Grid item key={el.id} xs={12} sm={6} md={4} >
            <div className={classes.box}>
              <Typography variant="h6" gutterBottom>
                {el.title}
              </Typography>

              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {`Owner: ${el.owner}`}
              </Typography>
              <Typography variant="body2">
                {el.description.length > 80
                  ? `${el.description.slice(0, 80)}...`
                  : el.description}
              </Typography>
              <div className={classes.actions}>
                <button className={classes.viewButton} onClick={() => handleView(el)}>
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
        <div className={classes.drawerContent}>
          {selectedCard && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedCard.title}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {`Owner: ${selectedCard.owner}`}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedCard.description}
              </Typography>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
};
