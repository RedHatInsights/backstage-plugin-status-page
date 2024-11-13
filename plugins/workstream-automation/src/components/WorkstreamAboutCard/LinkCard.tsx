import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
} from '@material-ui/core';
import React from 'react';

type LinkCardProps = {
  title?: string;
  href: string;
  Icon?: React.JSX.Element;
};

export const LinkCard = (props: LinkCardProps) => {
  const { Icon, href, title } = props;
  return (
    <Card variant="outlined" style={{ margin: '4px', width: '5rem' }}>
      <CardActionArea target="_blank" href={href}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          margin="12px 0 12px 0"
          textAlign="center"
        >
          <Grid xs={12}>{Icon}</Grid>
          <Grid xs={12}>
            <CardContent style={{ padding: '8px 0 0 0' }}>{title}</CardContent>
          </Grid>
        </Box>
      </CardActionArea>
    </Card>
  );
};
