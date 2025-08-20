import { Knex } from 'knex';
import express from 'express';
import { createAuditApplicationsRouter } from './auditApplicationsRoutes';
import { createDataSyncRouter } from './auditDataSyncRoutes';
import { createDetailsRouter } from './auditDetailsRoutes';
import { createAuditInitiationRouter } from './auditInitiationRoutes';
import { createAuditSummaryRouter } from './auditSummaryRoutes';
import { createEmailRouter } from './emailRoutes';
import { createJiraRouter } from './jiraRoutes';
import { createDataDeletionRouter } from './dataDeletionRoutes';
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { createRoleManagementRouter } from './roleManagementRoutes';
import { CustomAuthorizer } from '../types/permissions';

export const createCombinedRouter = async (
  knex: Knex,
  config: any,
  logger: any,
  permissions: CustomAuthorizer,
  httpAuth: HttpAuthService,
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
    dataDeletionRouter,
    roleManagementRouter,
  ] = await Promise.all([
    createDetailsRouter(knex, logger, config, permissions, httpAuth),
    createDataSyncRouter(knex, config, logger, permissions, httpAuth),
    createAuditSummaryRouter(knex, logger, config, permissions, httpAuth),
    createAuditApplicationsRouter(knex, logger, config, permissions, httpAuth),
    createJiraRouter(knex, logger, config, permissions, httpAuth),
    createAuditInitiationRouter(knex, config, logger, permissions, httpAuth),
    createEmailRouter(config, logger, permissions, httpAuth, knex),
    createDataDeletionRouter(knex, logger, config, permissions, httpAuth),
    createRoleManagementRouter(knex, logger, config, permissions, httpAuth),
  ]);

  router.use('/', detailsRouter);
  router.use('/', dataSyncRouter);
  router.use('/', auditSummaryRouter);
  router.use('/', auditApplicationsRouter);
  router.use('/', jiraRouter);
  router.use('/', auditInitiationRouter);
  router.use('/', emailRouter);
  router.use('/', dataDeletionRouter);
  router.use('/', roleManagementRouter);

  return router;
};
