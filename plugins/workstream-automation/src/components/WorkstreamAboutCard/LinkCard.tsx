import { useApp } from '@backstage/core-plugin-api';
import {
  Box,
  CardActionArea,
  CardContent,
  Grid,
  Tooltip,
  Typography,
} from '@material-ui/core';
import LinkTwoTone from '@material-ui/icons/LinkTwoTone';

type LinkCardProps = {
  title?: string;
  href: string;
  Icon?: React.JSX.Element;
};

export const LinkIcon = (props: { val?: string }) => {
  const app = useApp();
  const { val: key } = props;
  const Icon = key ? app.getSystemIcon(key) ?? LinkTwoTone : LinkTwoTone;
  return <Icon color="inherit" fontSize="large" />;
};

export const LinkCard = (props: LinkCardProps) => {
  const { Icon, href, title } = props;
  return (
    <CardActionArea target="_blank" style={{ width: '5rem' }} href={href}>
      <Tooltip
        title={title && title.length > 14 ? title : ''}
        placement="bottom"
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          margin="12px 0 12px 0"
          textAlign="center"
        >
          <Grid xs={12}>{Icon}</Grid>
          <Grid xs={12}>
            <CardContent
              style={{
                padding: '8px 1px 0 1px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Typography variant="button">
                {title && title.length > 14
                  ? `${title.substring(0, 14)}...`
                  : title}
              </Typography>
            </CardContent>
          </Grid>
        </Box>
      </Tooltip>
    </CardActionArea>
  );
};
