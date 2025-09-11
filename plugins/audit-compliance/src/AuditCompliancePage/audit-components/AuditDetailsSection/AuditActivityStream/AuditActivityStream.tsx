import { InfoCard } from '@backstage/core-components';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { useCallback, useEffect, useRef } from 'react';
import { useStyles } from './AuditActivityStream.styles';
import { AuditEvent } from './types';
import { ActivityItem } from './ActivityItem';
import { SearchBar } from './SearchBar';
import { useActivityStreamData, useActivitySearch } from './hooks';

interface Props {
  key?: string;
  app_name?: string;
  frequency?: string;
  period?: string;
  showAll?: boolean; // When true, shows all data without pagination/scrolling for export
  global?: boolean; // When true, shows activities from all applications
}

// Main component
export const AuditActivityStream: React.FC<Props> = ({
  app_name,
  frequency,
  period,
  showAll = false,
  global = false,
}) => {
  const classes = useStyles();
  const ref = useRef<HTMLDivElement>(null);

  const { events, loading, error, hasMore, offset, fetchEvents } =
    useActivityStreamData(app_name, frequency, period, showAll, global);

  const { searchTerm, setSearchTerm, filteredEvents, clearSearch } =
    useActivitySearch(events);

  // Handle infinite scrolling
  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (
      el &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
      !loading &&
      hasMore
    ) {
      fetchEvents(offset);
    }
  }, [loading, hasMore, offset, fetchEvents]);

  useEffect(() => {
    if (!showAll) {
      const el = ref.current;
      if (el) {
        el.addEventListener('scroll', handleScroll);
      }
      return () => {
        if (el) {
          el.removeEventListener('scroll', handleScroll);
        }
      };
    }
    return undefined;
  }, [loading, hasMore, offset, showAll, handleScroll]);

  if (error) {
    return (
      <InfoCard title="Activity Stream" noPadding>
        <Box p={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      </InfoCard>
    );
  }

  const containerClassName = showAll ? undefined : classes.cardContainer;
  const containerStyle = showAll ? { padding: '20px' } : undefined;

  const activityContent = (
    <div ref={ref} className={containerClassName} style={containerStyle}>
      {filteredEvents.length === 0 && searchTerm ? (
        <Box p={3} textAlign="center">
          <Typography color="textSecondary">
            No activities found matching "{searchTerm}"
          </Typography>
        </Box>
      ) : (
        filteredEvents.map(event => (
          <ActivityItem key={event.id} event={event} />
        ))
      )}

      {loading && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress size={20} />
        </Box>
      )}
    </div>
  );

  // For showAll mode, render without InfoCard wrapper
  if (showAll) {
    return activityContent;
  }

  // Custom title component with search field
  const customTitle = (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
    >
      <Typography variant="h6" component="span">
        Activity Stream
      </Typography>
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClear={clearSearch}
        resultCount={filteredEvents.length}
      />
    </Box>
  );

  // For regular mode, wrap in InfoCard
  return (
    <InfoCard title={customTitle} noPadding>
      {activityContent}
    </InfoCard>
  );
};
