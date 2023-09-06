import React from 'react';
import { Box, Typography, makeStyles, createStyles } from '@material-ui/core';

const useStyles = makeStyles(() =>
  createStyles({
    subtitles: {
      whiteSpace: 'nowrap',
    },
  }),
);

export const Status = ({
  name,
  iconUrl,
}: {
  name: string;
  iconUrl: string;
}) => {
  const classes = useStyles();
  return (
    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
      <img src={iconUrl} alt="" />
      <Box ml={1} className={classes.subtitles}>
        <Typography variant="subtitle2">{name}</Typography>
      </Box>
    </Box>
  );
};
