import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

/**
 * Creates the plugin router with all endpoint definitions.
 * @param config - The root config service
 * @param logger - The logger service
 * @returns An Express router instance with all routes
 */
export async function createDetailsRouter(
  knex: Knex,
  logger: any,
  config: any,
): Promise<express.Router> {
  const database = await AuditComplianceDatabase.create({
    knex,
    skipMigrations: true,
    logger,
    config,
  });

  const auditDetailsRouter = Router();

  /**
   * GET /access-reviews
   * Retrieves access reviews for a specific application.
   *
   * @route GET /access-reviews
   * @query {string} app_name - Application name
   * @query {string} frequency - Review frequency
   * @query {string} period - Review period
   * @returns {Array} 200 - List of access reviews
   * @returns {Object} 400 - Missing parameters error
   * @returns {Object} 500 - Error response
   */
  auditDetailsRouter.get('/access-reviews', async (req, res) => {
    const { app_name, frequency, period } = req.query;

    if (!app_name || !frequency || !period) {
      return res.status(400).json({
        error: 'Missing required query parameters: app_name, frequency, period',
      });
    }

    try {
      const reviews = await database.getAccessReviews({
        app_name: app_name as string,
        frequency: frequency as string,
        period: period as string,
      });
      return res.json(reviews);
    } catch (error) {
      console.error('Failed to fetch access reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch access reviews' });
    }
  });

  /**
   * POST /access-reviews
   * Updates access review records.
   *
   * @route POST /access-reviews
   * @param {Array|Object} req.body - Access review data to update
   * @returns {Object} 200 - Update results
   * @returns {Object} 400 - Invalid payload error
   * @returns {Object} 500 - Error response
   */
  auditDetailsRouter.post('/access-reviews', async (req, res) => {
    try {
      const payload = req.body;

      if (!payload || (Array.isArray(payload) && payload.length === 0)) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      const dataArray = Array.isArray(payload) ? payload : [payload];
      const results = await database.updateAccessReview(dataArray);
      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      logger.error('Error updating access review data', {
        error: String(error),
      });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /activity-stream
   * Retrieves activity stream events for an application.
   *
   * @route GET /activity-stream
   * @query {string} app_name - Application name
   * @query {string} [frequency] - Optional review frequency
   * @query {string} [period] - Optional review period
   * @query {number} [limit] - Optional result limit
   * @query {number} [offset] - Optional result offset
   * @returns {Array} 200 - List of activity events
   * @returns {Object} 400 - Missing parameters error
   * @returns {Object} 500 - Error response
   */
  auditDetailsRouter.get('/activity-stream', async (req, res) => {
    const { app_name, frequency, period, limit, offset } = req.query;

    if (!app_name) {
      return res.status(400).json({
        error: 'Missing required query parameter: app_name',
      });
    }

    try {
      const events = await database.getActivityStreamEvents({
        app_name: app_name as string,
        frequency: frequency as string,
        period: period as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return res.json(events);
    } catch (error) {
      logger.error('Failed to fetch activity stream events', {
        error: error instanceof Error ? error.message : String(error),
      });
      return res
        .status(500)
        .json({ error: 'Failed to fetch activity stream events' });
    }
  });

  /**
   * POST /activity-stream
   * Creates a new activity stream event.
   *
   * @route POST /activity-stream
   * @param {Object} req.body - Event details
   * @returns {Object} 201 - Created event
   * @returns {Object} 400 - Missing required fields error
   * @returns {Object} 500 - Error response
   */
  auditDetailsRouter.post('/activity-stream', async (req, res) => {
    const {
      event_type,
      app_name,
      frequency,
      period,
      user_id,
      performed_by,
      metadata,
    } = req.body;

    if (!event_type || !app_name || !performed_by) {
      return res.status(400).json({
        error: 'Missing required fields: event_type, app_name, performed_by',
      });
    }

    try {
      const event = await database.createActivityEvent({
        event_type: 'AUDIT_INITIATED',
        app_name,
        frequency,
        period,
        user_id,
        performed_by,
        metadata,
      });
      return res.status(201).json(event);
    } catch (error) {
      logger.error('Failed to create activity stream event', {
        error: error instanceof Error ? error.message : String(error),
      });
      return res
        .status(500)
        .json({ error: 'Failed to create activity stream event' });
    }
  });

  /**
   * GET /audits/:app_name/:frequency/:period/details
   * Retrieves detailed information about an audit.
   *
   * @route GET /audits/:app_name/:frequency/:period/details
   * @param {string} req.params.app_name - Application name
   * @param {string} req.params.frequency - Review frequency
   * @param {string} req.params.period - Review period
   * @returns {Object} 200 - Audit details
   * @returns {Object} 404 - Audit or application not found
   * @returns {Object} 500 - Error response
   */
  auditDetailsRouter.get(
    '/audits/:app_name/:frequency/:period/details',
    async (req, res) => {
      const { app_name, frequency, period } = req.params;

      try {
        const audit = await database.findAuditByAppNamePeriod(
          app_name,
          frequency,
          period,
        );
        if (!audit) {
          return res.status(404).json({ error: 'Audit not found' });
        }

        const appDetails = await database.getApplicationDetails(app_name);
        if (!appDetails) {
          return res
            .status(404)
            .json({ error: 'Application details not found' });
        }

        // Get app owners
        const appOwners = await database.getDistinctAppOwners(app_name);

        return res.json({
          reviewPeriod: {
            startDate: audit.start_date,
            endDate: audit.end_date,
          },
          reviewedBy: appOwners.join(', '),
          reviewScope: `All ${
            appDetails.environment || 'production and staging'
          } environments for ${app_name} application`,
        });
      } catch (error: unknown) {
        logger.error('Error fetching audit details:', { error: String(error) });
        return res.status(500).json({ error: 'Failed to fetch audit details' });
      }
    },
  );

  /**
   * GET /service_account_access_review
   * Retrieves service account access reviews.
   *
   * @route GET /service_account_access_review
   * @query {string} app_name - Application name
   * @query {string} frequency - Review frequency
   * @query {string} period - Review period
   * @returns {Array} 200 - List of service account access reviews
   * @returns {Object} 400 - Missing parameters error
   * @returns {Object} 500 - Error response
   */
  auditDetailsRouter.get('/service_account_access_review', async (req, res) => {
    const { app_name, frequency, period } = req.query;

    if (!app_name || !frequency || !period) {
      return res.status(400).json({
        error:
          'Missing required query parameters: app_name, frequency, and period',
      });
    }

    try {
      const reviews = await database.getServiceAccountAccessReviews({
        app_name: app_name as string,
        frequency: frequency as string,
        period: period as string,
      });
      return res.json(reviews);
    } catch (error) {
      console.error('Failed to fetch access reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch access reviews' });
    }
  });

  /**
   * POST /service_account_access_review
   * Updates service account access review records.
   *
   * @route POST /service_account_access_review
   * @param {Array|Object} req.body - Service account access review data
   * @returns {Object} 200 - Update results
   * @returns {Object} 400 - Invalid payload error
   * @returns {Object} 500 - Error response
   */
  auditDetailsRouter.post(
    '/service_account_access_review',
    async (req, res) => {
      const payload = req.body;

      try {
        if (!payload || (Array.isArray(payload) && payload.length === 0)) {
          return res.status(400).json({ error: 'No data provided' });
        }

        const result = await database.updateServiceAccountAccessReviewData(
          payload,
        );
        return res.json(result);
      } catch (error) {
        logger.error('Failed to update service account access review', {
          error: String(error),
        });
        return res.status(500).json({ error: 'Internal server error' });
      }
    },
  );
  return auditDetailsRouter;
}
