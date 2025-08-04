import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';

interface AuditHistoryItem {
  application_id: string;
  app_name: string;
  frequency: string;
  period: string;
  status: string;
  created_at: string;
  jira_key: string;
}

interface ActivityStreamProps {
  auditHistory: AuditHistoryItem[];
  onRefresh: () => void;
  getStatusChipStyle: (status: string) => React.CSSProperties;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({
  auditHistory,
  onRefresh,
  getStatusChipStyle,
}) => {
  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Recent Activity</Typography>
          <IconButton size="small" onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Box>

        <Box maxHeight={400} overflow="auto">
          {auditHistory.length === 0 ? (
            <Typography variant="body2" color="textSecondary" align="center">
              No recent audit activity
            </Typography>
          ) : (
            auditHistory.slice(0, 10).map((audit, index) => (
              <Box
                key={index}
                mb={2}
                p={1}
                border="1px solid #e0e0e0"
                borderRadius={1}
              >
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  {audit.app_name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {audit.frequency} {audit.period}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={audit.status}
                    style={getStatusChipStyle(audit.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {new Date(audit.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
