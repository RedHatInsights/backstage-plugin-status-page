import { Link, Chip, Box, Typography, Tooltip } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { configApiRef } from '@backstage/core-plugin-api';

export interface EpicDisplayProps {
  epicKey?: string;
  epicTitle?: string;
  showTitle?: boolean;
  showKey?: boolean;
  variant?: 'chip' | 'link' | 'text';
  size?: 'small' | 'medium';
  className?: string;
}

export const EpicDisplay: React.FC<EpicDisplayProps> = ({
  epicKey,
  epicTitle,
  showTitle = true,
  showKey = true,
  variant = 'link',
  size = 'medium',
  className,
}) => {
  const configApi = useApi(configApiRef);
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');

  if (!epicKey || epicKey === 'N/A') {
    return (
      <Typography variant="body2" color="textSecondary">
        N/A
      </Typography>
    );
  }

  const epicUrl = `${jiraUrl}/browse/${epicKey}`;
  let displayText: string;
  if (showKey && showTitle && epicTitle) {
    displayText = `${epicKey} - ${epicTitle}`;
  } else if (showKey) {
    displayText = epicKey;
  } else {
    displayText = epicTitle || epicKey;
  }

  const renderContent = () => {
    switch (variant) {
      case 'chip':
        return (
          <Chip
            label={displayText}
            size={size}
            clickable
            component="a"
            href={epicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            style={{
              maxWidth: '300px',
            }}
          />
        );

      case 'link':
        return (
          <Link
            href={epicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            style={{
              color: '#1976d2',
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'inline-block',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayText}
          </Link>
        );

      case 'text':
      default:
        return (
          <Typography
            variant="body2"
            className={className}
            style={{
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayText}
          </Typography>
        );
    }
  };

  return (
    <Tooltip title={epicTitle || epicKey} arrow>
      <Box display="inline-block" maxWidth="300px">
        {renderContent()}
      </Box>
    </Tooltip>
  );
};

export default EpicDisplay;
