import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { AuditEvent } from './types';
import { getEventDisplayText } from './utils';

// Custom hook for activity stream data fetching
export const useActivityStreamData = (
  app_name?: string,
  frequency?: string,
  period?: string,
  showAll = false,
  global = false,
) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchEvents = useCallback(
    async (currentOffset: number) => {
      try {
        setLoading(true);
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

        let endpoint: string;

        if (global) {
          endpoint = `/activity-stream?all=true&limit=20&offset=${currentOffset}`;
        } else if (showAll) {
          endpoint = `/activity-stream/export?app_name=${encodeURIComponent(
            app_name!,
          )}&frequency=${encodeURIComponent(
            frequency!,
          )}&period=${encodeURIComponent(period!)}`;
        } else {
          endpoint = `/activity-stream?app_name=${encodeURIComponent(
            app_name!,
          )}&frequency=${encodeURIComponent(
            frequency!,
          )}&period=${encodeURIComponent(
            period!,
          )}&limit=20&offset=${currentOffset}`;
        }

        const response = await fetchApi.fetch(`${baseUrl}${endpoint}`);

        if (!response.ok) {
          throw new Error('Failed to fetch activity events');
        }

        const data = await response.json();

        if (showAll) {
          setEvents(data);
          setHasMore(false);
        } else {
          setEvents(prev => [...prev, ...data]);
          setHasMore(data.length === 20);
          setOffset(currentOffset + data.length);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch activity events',
        );
      } finally {
        setLoading(false);
      }
    },
    [app_name, frequency, period, showAll, global, discoveryApi, fetchApi],
  );

  useEffect(() => {
    fetchEvents(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_name, frequency, period, global]);

  return { events, loading, error, hasMore, offset, fetchEvents };
};

// Custom hook for search functionality
export const useActivitySearch = (events: AuditEvent[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return events;

    const searchLower = searchTerm.toLowerCase();
    return events.filter(event => {
      const displayText = getEventDisplayText(event);
      return displayText.toLowerCase().includes(searchLower);
    });
  }, [events, searchTerm]);

  const clearSearch = useCallback(() => setSearchTerm(''), []);

  return { searchTerm, setSearchTerm, filteredEvents, clearSearch };
};
