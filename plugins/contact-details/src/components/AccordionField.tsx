import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Grid,
  Theme,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  EntityPeekAheadPopover,
  EntityRefLink,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import {
  DEFAULT_NAMESPACE,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import UserIcon from '@material-ui/icons/PersonOutlineRounded';
import AddIcon from '@material-ui/icons/AddOutlined';
import { useApi } from '@backstage/core-plugin-api';

const useStyles = makeStyles((theme: Theme) => ({
  label: {
    color: theme.palette.text.secondary,
    fontSize: '1rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    overflow: 'hidden',
    whiteSpace: 'break-spaces',
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
    textAlign: 'right',
    marginLeft: 'auto',
  },
  value: {
    fontWeight: 'bold',
    lineHeight: '24px',
    wordBreak: 'break-word',
  },
}));

export interface CardFieldProps {
  expanded?: boolean;
  label: string;
  variant?: 'user' | 'group';
  value?: string;
  values?: Array<string>;
}

export const AccordionField = (props: CardFieldProps) => {
  const {
    label,
    variant = 'user',
    value,
    values = [],
    expanded = false,
  } = props;
  const [secondaryLabel, setSecondaryLabel] = useState('');
  const [userRefs, setUserRefs] = useState<string[]>();
  const [showMoreLink, setShowMoreLink] = useState(false);
  const maxVisibleGroupMembers = 5;

  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);

  /**
   * MAGIC:
   * Using 2 different useEffects here because having `values` and the catalog API call
   * in the same useEffect callback causes an infinite render issue.
   * DO NOT merge them together unless absolutely sure.
   */
  useEffect(() => {
    if (variant === 'user' && values?.length > 0) {
      setUserRefs(values);
      if (values.length > 1) {
        setSecondaryLabel(`+ ${values.length} people`);
      } else {
        setSecondaryLabel(
          parseEntityRef(values[0], {
            defaultKind: 'user',
            defaultNamespace: DEFAULT_NAMESPACE,
          }).name,
        );
      }
    }
  }, [values, variant]);
  useEffect(() => {
    if (variant === 'group') {
      const getGroupMembers = async () => {
        const group = await catalogApi.getEntityByRef(value!);
        const members = (group?.spec?.members as string[]) ?? [];
        setUserRefs(members.slice(0, maxVisibleGroupMembers));
        if (members.length > maxVisibleGroupMembers) {
          setShowMoreLink(true);
        }
      };
      getGroupMembers();
      setSecondaryLabel(
        parseEntityRef(value!, {
          defaultKind: 'group',
          defaultNamespace: DEFAULT_NAMESPACE,
        }).name,
      );
    }
  }, [catalogApi, value, variant]);

  const Details = () => {
    return (
      <>
        {userRefs?.map(userRef => {
          const entity = parseEntityRef(userRef, {
            defaultKind: 'user',
            defaultNamespace: DEFAULT_NAMESPACE,
          });

          return (
            <EntityPeekAheadPopover entityRef={stringifyEntityRef(entity)}>
              <Chip icon={<UserIcon />} label={entity.name} />
            </EntityPeekAheadPopover>
          );
        })}
      </>
    );
  };

  return (
    <Grid item xs={12}>
      <Accordion square defaultExpanded={expanded}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h3" className={classes.label}>
            {label}
          </Typography>
          <Typography className={classes.secondaryHeading}>
            {secondaryLabel}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexWrap="wrap">
            <Details />
            {variant === 'group' && value && showMoreLink && (
              <Chip
                icon={<AddIcon />}
                variant="outlined"
                color="primary"
                component={p => <EntityRefLink entityRef={value} {...p} />}
                label="more"
                clickable
              />
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
};
