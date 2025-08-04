import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import { AuditComplianceDatabase } from '../database/AuditComplianceDatabase';

/**
 * Creates the data deletion router with all endpoint definitions.
 * @param knex - The shared Knex client
 * @param logger - The logger service
 * @param config - The configuration service
 * @returns An Express router instance with all data deletion routes
 */
export async function createDataDeletionRouter(
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

  const dataDeletionRouter = Router();

  /**
   * DELETE /delete/application/:id
   * Deletes a specific application by ID
   *
   * @route DELETE /delete/application/:id
   * @param {number} id - Application ID to delete
   * @returns {Object} 200 - Success response with deletion count
   * @returns {Object} 404 - Application not found
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/application/:id',
    async (req, res): Promise<void> => {
      try {
        const { id } = req.params;
        const applicationId = parseInt(id, 10);

        if (isNaN(applicationId)) {
          res.status(400).json({ error: 'Invalid application ID' });
          return;
        }

        const deletedCount = await database.deleteApplicationById(
          applicationId,
        );

        if (deletedCount === 0) {
          res.status(404).json({ error: 'Application not found' });
          return;
        }

        res.json({
          message: 'Application deleted successfully',
          deletedCount,
        });
      } catch (error) {
        logger.error('Failed to delete application', {
          error: error instanceof Error ? error.message : String(error),
          applicationId: req.params.id,
        });
        res.status(500).json({
          error: 'Failed to delete application',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/application/name/:appName
   * Deletes all records for a specific application by name
   *
   * @route DELETE /delete/application/name/:appName
   * @param {string} appName - Application name to delete
   * @returns {Object} 200 - Success response with deletion summary
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/application/name/:appName',
    async (req, res): Promise<void> => {
      try {
        const { appName } = req.params;
        const normalizedAppName = appName.toLowerCase().replace(/\s+/g, '-');

        const deletionSummary = await database.deleteApplicationByName(
          normalizedAppName,
        );

        res.json({
          message: 'Application data deleted successfully',
          ...deletionSummary,
        });
      } catch (error) {
        logger.error('Failed to delete application by name', {
          error: error instanceof Error ? error.message : String(error),
          appName: req.params.appName,
        });
        res.status(500).json({
          error: 'Failed to delete application data',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/audit/:id
   * Deletes a specific audit record by ID
   *
   * @route DELETE /delete/audit/:id
   * @param {number} id - Audit ID to delete
   * @returns {Object} 200 - Success response with deletion count
   * @returns {Object} 404 - Audit not found
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/audit/:id',
    async (req, res): Promise<void> => {
      try {
        const { id } = req.params;
        const auditId = parseInt(id, 10);

        if (isNaN(auditId)) {
          res.status(400).json({ error: 'Invalid audit ID' });
          return;
        }

        const deletedCount = await database.deleteAuditById(auditId);

        if (deletedCount === 0) {
          res.status(404).json({ error: 'Audit not found' });
          return;
        }

        res.json({
          message: 'Audit deleted successfully',
          deletedCount,
        });
      } catch (error) {
        logger.error('Failed to delete audit', {
          error: error instanceof Error ? error.message : String(error),
          auditId: req.params.id,
        });
        res.status(500).json({
          error: 'Failed to delete audit',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/audit/period
   * Deletes audit data for a specific app/frequency/period combination
   *
   * @route DELETE /delete/audit/period
   * @query {string} app_name - Application name
   * @query {string} frequency - Review frequency (quarterly, yearly, etc.)
   * @query {string} period - Review period (Q1-2025, 2025, etc.)
   * @returns {Object} 200 - Success response with deletion summary
   * @returns {Object} 400 - Missing required parameters
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/audit/period',
    async (req, res): Promise<void> => {
      try {
        const { app_name, frequency, period } = req.query;

        if (!app_name || !frequency || !period) {
          res.status(400).json({
            error:
              'Missing required parameters: app_name, frequency, and period are required',
          });
          return;
        }

        const normalizedAppName = (app_name as string)
          .toLowerCase()
          .replace(/\s+/g, '-');

        const deletionSummary = await database.deleteAuditData(
          normalizedAppName,
          frequency as string,
          period as string,
        );

        res.json({
          message: 'Audit data deleted successfully',
          ...deletionSummary,
        });
      } catch (error) {
        logger.error('Failed to delete audit data by period', {
          error: error instanceof Error ? error.message : String(error),
          query: req.query,
        });
        res.status(500).json({
          error: 'Failed to delete audit data',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/service-accounts/:id
   * Deletes a specific service account access review by ID
   *
   * @route DELETE /delete/service-accounts/:id
   * @param {number} id - Service account access review ID to delete
   * @returns {Object} 200 - Success response with deletion count
   * @returns {Object} 404 - Record not found
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/service-accounts/:id',
    async (req, res): Promise<void> => {
      try {
        const { id } = req.params;
        const recordId = parseInt(id, 10);

        if (isNaN(recordId)) {
          res.status(400).json({ error: 'Invalid record ID' });
          return;
        }

        const deletedCount =
          await database.deleteServiceAccountAccessReviewById(recordId);

        if (deletedCount === 0) {
          res
            .status(404)
            .json({ error: 'Service account access review not found' });
          return;
        }

        res.json({
          message: 'Service account access review deleted successfully',
          deletedCount,
        });
      } catch (error) {
        logger.error('Failed to delete service account access review', {
          error: error instanceof Error ? error.message : String(error),
          recordId: req.params.id,
        });
        res.status(500).json({
          error: 'Failed to delete service account access review',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/group-access/:id
   * Deletes a specific group access report by ID
   *
   * @route DELETE /delete/group-access/:id
   * @param {number} id - Group access report ID to delete
   * @returns {Object} 200 - Success response with deletion count
   * @returns {Object} 404 - Record not found
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/group-access/:id',
    async (req, res): Promise<void> => {
      try {
        const { id } = req.params;
        const recordId = parseInt(id, 10);

        if (isNaN(recordId)) {
          res.status(400).json({ error: 'Invalid record ID' });
          return;
        }

        const deletedCount = await database.deleteGroupAccessReportById(
          recordId,
        );

        if (deletedCount === 0) {
          res.status(404).json({ error: 'Group access report not found' });
          return;
        }

        res.json({
          message: 'Group access report deleted successfully',
          deletedCount,
        });
      } catch (error) {
        logger.error('Failed to delete group access report', {
          error: error instanceof Error ? error.message : String(error),
          recordId: req.params.id,
        });
        res.status(500).json({
          error: 'Failed to delete group access report',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/fresh-data
   * Deletes fresh data for a specific app/frequency/period combination
   *
   * @route DELETE /delete/fresh-data
   * @query {string} app_name - Application name
   * @query {string} frequency - Review frequency (quarterly, yearly, etc.)
   * @query {string} period - Review period (Q1-2025, 2025, etc.)
   * @returns {Object} 200 - Success response with deletion summary
   * @returns {Object} 400 - Missing required parameters
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/fresh-data',
    async (req, res): Promise<void> => {
      try {
        const { app_name, frequency, period } = req.query;

        if (!app_name || !frequency || !period) {
          res.status(400).json({
            error:
              'Missing required parameters: app_name, frequency, and period are required',
          });
          return;
        }

        const normalizedAppName = (app_name as string)
          .toLowerCase()
          .replace(/\s+/g, '-');

        const deletionSummary = await database.deleteFreshData(
          normalizedAppName,
          frequency as string,
          period as string,
        );

        res.json({
          message: 'Fresh data deleted successfully',
          ...deletionSummary,
        });
      } catch (error) {
        logger.error('Failed to delete fresh data', {
          error: error instanceof Error ? error.message : String(error),
          query: req.query,
        });
        res.status(500).json({
          error: 'Failed to delete fresh data',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/activity-stream/:id
   * Deletes a specific activity stream event by ID
   *
   * @route DELETE /delete/activity-stream/:id
   * @param {number} id - Activity stream event ID to delete
   * @returns {Object} 200 - Success response with deletion count
   * @returns {Object} 404 - Event not found
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/activity-stream/:id',
    async (req, res): Promise<void> => {
      try {
        const { id } = req.params;
        const eventId = parseInt(id, 10);

        if (isNaN(eventId)) {
          res.status(400).json({ error: 'Invalid event ID' });
          return;
        }

        const deletedCount = await database.deleteActivityStreamEventById(
          eventId,
        );

        if (deletedCount === 0) {
          res.status(404).json({ error: 'Activity stream event not found' });
          return;
        }

        res.json({
          message: 'Activity stream event deleted successfully',
          deletedCount,
        });
      } catch (error) {
        logger.error('Failed to delete activity stream event', {
          error: error instanceof Error ? error.message : String(error),
          eventId: req.params.id,
        });
        res.status(500).json({
          error: 'Failed to delete activity stream event',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/audit-metadata/:id
   * Deletes audit metadata by ID
   *
   * @route DELETE /delete/audit-metadata/:id
   * @param {number} id - Audit metadata ID to delete
   * @returns {Object} 200 - Success response with deletion count
   * @returns {Object} 404 - Metadata not found
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/audit-metadata/:id',
    async (req, res): Promise<void> => {
      try {
        const { id } = req.params;
        const metadataId = parseInt(id, 10);

        if (isNaN(metadataId)) {
          res.status(400).json({ error: 'Invalid metadata ID' });
          return;
        }

        const deletedCount = await database.deleteAuditMetadataById(metadataId);

        if (deletedCount === 0) {
          res.status(404).json({ error: 'Audit metadata not found' });
          return;
        }

        res.json({
          message: 'Audit metadata deleted successfully',
          deletedCount,
        });
      } catch (error) {
        logger.error('Failed to delete audit metadata', {
          error: error instanceof Error ? error.message : String(error),
          metadataId: req.params.id,
        });
        res.status(500).json({
          error: 'Failed to delete audit metadata',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * DELETE /delete/all-data
   * Deletes all data from all tables (DANGEROUS - use with caution)
   *
   * @route DELETE /delete/all-data
   * @returns {Object} 200 - Success response with deletion summary
   * @returns {Object} 500 - Error response
   */
  dataDeletionRouter.delete(
    '/delete/all-data',
    async (_req, res): Promise<void> => {
      try {
        const deletionSummary = await database.deleteAllData();

        res.json({
          message: 'All data deleted successfully',
          ...deletionSummary,
        });
      } catch (error) {
        logger.error('Failed to delete all data', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          error: 'Failed to delete all data',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  return dataDeletionRouter;
}
