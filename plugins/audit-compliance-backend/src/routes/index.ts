import { Knex } from 'knex';
import express from 'express';
import { createAuditApplicationsRouter } from './auditApplicationsRoutes';
import { createDataSyncRouter } from './auditDataSyncRoutes';
import { createDetailsRouter } from './auditDetailsRoutes';
import { createAuditInitiationRouter } from './auditInitiationRoutes';
import { createAuditSummaryRouter } from './auditSummaryRoutes';
import { createEmailRouter } from './emailRoutes';
import { createJiraRouter } from './jiraRoutes';

export const createCombinedRouter = async (
  knex: Knex,
  config: any,
  logger: any,
): Promise<express.Router> => {
  const router = express.Router();

  const [
    detailsRouter,
    dataSyncRouter,
    auditSummaryRouter,
    auditApplicationsRouter,
    jiraRouter,
    auditInitiationRouter,
    emailRouter,
  ] = await Promise.all([
    createDetailsRouter(knex, logger, config),
    createDataSyncRouter(knex, config, logger),
    createAuditSummaryRouter(knex, logger, config),
    createAuditApplicationsRouter(knex, logger, config),
    createJiraRouter(knex, logger, config),
    createAuditInitiationRouter(knex, config, logger),
    createEmailRouter(config, logger),
  ]);

  router.use('/', detailsRouter);
  router.use('/', dataSyncRouter);
  router.use('/', auditSummaryRouter);
  router.use('/', auditApplicationsRouter);
  router.use('/', jiraRouter);
  router.use('/', auditInitiationRouter);
  router.use('/', emailRouter);

  return router;
};
