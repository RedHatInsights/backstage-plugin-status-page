import { Link } from '@backstage/core-components';
import { Box, Typography } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/InfoOutlined';

export const Disclosure = () => {
  return (
    <Box textAlign="center" mt={1} fontWeight="thin">
      <Link to="/docs">
        <Typography variant="caption" component="small">
          Compass Assistant uses AI. Check for mistakes.
          <Box ml={0.25} display="inline">
            <InfoIcon
              color="primary"
              alignmentBaseline="auto"
              fontSize="inherit"
            />
          </Box>
        </Typography>
      </Link>
    </Box>
  );
};
