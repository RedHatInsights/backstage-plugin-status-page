import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { JsonObject } from '@backstage/types';
import { Knex } from 'knex';
import { EventType } from './operations.types';

export class ActivityStreamOperations {
  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {}

  /**
   * Retrieves activity stream events with optional filtering and pagination.
   *
   * @param params - Query parameters
   * @param params.app_name - Name of the application
   * @param params.frequency - Optional frequency filter
   * @param params.period - Optional period filter
   * @param params.limit - Optional limit for number of results
   * @param params.offset - Optional offset for pagination
   * @returns Promise resolving to array of activity events
   */
  async getActivityStreamEvents(params: {
    app_name: string;
    frequency?: string;
    period?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { app_name, frequency, period, limit, offset } = params;

    this.logger.debug('Fetching activity stream events', {
      app_name,
      frequency,
      period,
      limit,
      offset,
    });

    let query = this.db('activity_stream')
      .where('app_name', 'ilike', app_name)
      .orderBy('created_at', 'desc');

    // Only filter by frequency and period if they are provided AND not null/undefined
    // This allows application-level events (without frequency/period) to be included
    if (frequency && frequency.trim() !== '') {
      query = query.andWhere(function () {
        this.where('frequency', frequency).orWhereNull('frequency');
      });
    }
    if (period && period.trim() !== '') {
      query = query.andWhere(function () {
        this.where('period', period).orWhereNull('period');
      });
    }
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    const events = await query.select();

    this.logger.info('Activity stream events retrieved', {
      app_name,
      frequency,
      period,
      total_events: events.length,
      event_types: events.map(e => e.event_type),
    });

    return events;
  }

  /**
   * Creates a new activity stream event with application context.
   *
   * @param event - Event data to create
   * @param event.event_type - Type of event
   * @param event.app_name - Name of the application
   * @param event.frequency - Optional frequency
   * @param event.period - Optional period
   * @param event.user_id - Optional user ID
   * @param event.performed_by - User who performed the action
   * @param event.metadata - Optional additional metadata
   * @returns Promise resolving to the created event record
   */
  async createActivityEvent(event: {
    event_type: EventType;
    app_name: string;
    frequency?: string;
    period?: string;
    user_id?: string;
    performed_by: string;
    metadata?: JsonObject;
  }): Promise<any> {
    this.logger.debug('Creating activity stream event', { event });

    // Get source and account_name from applications table
    const appDetails = await this.db('applications')
      .select('source', 'account_name')
      .where({ app_name: event.app_name })
      .first();

    // Extract metadata fields directly
    const { previous_status, new_status, reason } = event.metadata || {};

    const [createdEvent] = await this.db('activity_stream')
      .insert({
        event_type: event.event_type,
        app_name: event.app_name,
        frequency: event.frequency,
        period: event.period,
        user_id: event.user_id,
        performed_by: event.performed_by,
        source: appDetails?.source || null,
        account_name: appDetails?.account_name || null,
        previous_status: previous_status || null,
        new_status: new_status || null,
        reason: reason || null,
        created_at: this.db.fn.now(),
      })
      .returning('*');

    return createdEvent;
  }
}
