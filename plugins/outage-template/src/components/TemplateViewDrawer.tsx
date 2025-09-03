import { Box, Chip, Drawer, Paper, Typography } from '@material-ui/core';
import { getBackstageChipStyle } from '../utils';

const TemplateViewDrawer = ({ open, onClose, template }: any) => {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box style={{ width: 400, padding: 20 }}>
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
            Template Name
          </Typography>
          <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
            {template.name}
          </Paper>
        </Box>
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
            Impact
          </Typography>
          <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
            <Chip
              label={template.impactOverride.toLocaleUpperCase()}
              style={{
                margin: '4px',
                ...getBackstageChipStyle(template.impactOverride, 'default'),
              }}
            />
          </Paper>
        </Box>
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
            Status
          </Typography>
          <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
            <Chip
              variant="outlined"
              label={template.status.toLocaleUpperCase()}
              style={{
                margin: '4px',
                ...getBackstageChipStyle(template.status, 'outlined'),
              }}
            />
          </Paper>
        </Box>
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
            Description
          </Typography>
          <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
            {template.body}
          </Paper>
        </Box>
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
            Created On
          </Typography>
          <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
            {template.created_on}
          </Paper>
        </Box>
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="h6" style={{ marginTop: 0, marginBottom: 8 }}>
            Last Updated On
          </Typography>
          <Paper elevation={2} style={{ padding: 12, marginBottom: 10 }}>
            {template.last_updated_on}
          </Paper>
        </Box>
      </Box>
    </Drawer>
  );
};

export default TemplateViewDrawer;
