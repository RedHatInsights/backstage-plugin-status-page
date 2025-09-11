import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import InfoIcon from '@material-ui/icons/Info';
import { AuditEvent } from './types';
import { ACTIVITY_MESSAGES } from './ActivityMessage';

// Utility functions
export const getEventType = (event: AuditEvent): string => {
  return event.event_type || event.event_name || '';
};

export const getActivityIcon = (eventType: string) => {
  switch (eventType) {
    case 'ACCESS_REVOKED':
      return <CancelIcon style={{ color: '#dd2c00' }} />;
    case 'ACCESS_APPROVED':
    case 'AUDIT_COMPLETED':
    case 'AUDIT_INITIATED':
    case 'AUDIT_FINAL_SIGNOFF_COMPLETED':
      return <CheckCircleIcon style={{ color: '#43a047' }} />;
    default:
      return <InfoIcon style={{ color: '#0066CC' }} />;
  }
};

// Extract text content from React element children
export const extractTextFromChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join(' ');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as any).props.children);
  }
  return '';
};

// Get display text for an event (used for search)
export const getEventDisplayText = (event: AuditEvent): string => {
  const eventType = getEventType(event);
  const messageFunction =
    ACTIVITY_MESSAGES[eventType as keyof typeof ACTIVITY_MESSAGES] ||
    ACTIVITY_MESSAGES.default;
  const messageElement = messageFunction(event);

  if (
    messageElement &&
    'props' in messageElement &&
    messageElement.props.children
  ) {
    return extractTextFromChildren(messageElement.props.children);
  }
  return '';
};
