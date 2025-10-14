import express from 'express';
import Router from 'express-promise-router';
import {
  SyncFreshDataResult,
  RoverDataItem,
  GitLabDataItem,
  ManualDataItem,
} from '../types/types';
import { RoverDatabase } from '../database/integrations/RoverIntegration';
import { GitLabDatabase } from '../database/integrations/GitLabIntegration';
import { ManualDataIntegration } from '../database/integrations/ManualDataIntegration';
import { Knex } from 'knex';

/**
 * Creates the plugin router with all endpoint definitions.
 * @param config - The root config service
 * @param logger - The logger service
 * @returns An Express router instance with all routes
 */
export async function createDataSyncRouter(
  knex: Knex,
  config: any,
  logger: any,
): Promise<express.Router> {
  // Initialize Rover integrations database
  const roverStore = await RoverDatabase.create({
    knex,
    config,
    logger,
    skipMigrations: true,
  });

  // Initialize GitLab integrations database
  const gitlabStore = await GitLabDatabase.create({
    knex,
    config,
    logger,
  });

  // Initialize Manual integrations database
  const manualStore = new ManualDataIntegration(knex, logger);

  const dataSyncRouter = Router();

  /**
   * POST /sync-fresh-data
   * Synchronizes fresh data from Rover and GitLab sources.
   *
   * @route POST /sync-fresh-data
   * @param {Object} req.body - Sync parameters
   * @returns {Object} 200 - Sync results with statistics
   * @returns {Object} 400 - Missing parameters error
   * @returns {Object} 500 - Error response
   */
  dataSyncRouter.post('/sync-fresh-data', async (req, res) => {
    const { appname, frequency, period } = req.body;

    if (!appname || !frequency || !period) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const db = knex;

      // Use a transaction to ensure atomicity
      const result: SyncFreshDataResult = await db.transaction(
        async (trx: Knex.Transaction) => {
          // Fetch data from all sources, but do not fail if one is missing
          let roverData: RoverDataItem[] = [];
          let gitlabData: GitLabDataItem[] = [];
          let ldapData: any[] = [];
          let manualData: ManualDataItem[] = [];

          try {
            roverData = await roverStore.fetchRoverDataForFresh(
              appname,
              frequency,
              period,
            );
          } catch (e: any) {
            logger.warn(`Rover data not available: ${e.message || e}`);
          }

          try {
            gitlabData = await gitlabStore.fetchGitLabDataForFresh(
              appname,
              frequency,
              period,
            );
          } catch (e: any) {
            logger.warn(`GitLab data not available: ${e.message || e}`);
          }

          try {
            ldapData = await roverStore.fetchLDAPDataForFresh(
              appname,
              frequency,
              period,
            );
          } catch (e: any) {
            logger.warn(`LDAP data not available: ${e.message || e}`);
          }

          try {
            manualData = await manualStore.fetchManualDataForFresh(
              appname,
              frequency,
              period,
            );
          } catch (e: any) {
            logger.warn(`Manual data not available: ${e.message || e}`);
          }

          // Clear existing fresh data for this app/period combination
          await trx('service_account_access_review_fresh')
            .where({ app_name: appname, period, frequency })
            .delete();
          await trx('group_access_reports_fresh')
            .where({ app_name: appname, period, frequency })
            .delete();

          let roverServiceAccounts = 0;
          let roverGroupAccess = 0;
          let gitlabServiceAccounts = 0;
          let gitlabGroupAccess = 0;
          let ldapServiceAccounts = 0;
          let ldapGroupAccess = 0;
          let manualServiceAccounts = 0;
          let manualGroupAccess = 0;

          // Insert Rover data into fresh tables only
          if (roverData.length > 0) {
            // Handle service accounts
            const serviceAccounts = roverData
              .filter((item: RoverDataItem) => item.service_account)
              .map((item: RoverDataItem) => ({
                app_name: item.app_name,
                environment: item.environment,
                service_account: item.service_account,
                user_role: item.user_role,
                manager: item.manager,
                app_delegate: item.app_delegate,
                source: 'rover',
                account_name: item.account_name,
                period,
                frequency,
                created_at: new Date(),
              }));

            if (serviceAccounts.length > 0) {
              await trx('service_account_access_review_fresh').insert(
                serviceAccounts,
              );
              roverServiceAccounts = serviceAccounts.length;
            }

            // Handle group access
            const groupAccess = roverData
              .filter((item: RoverDataItem) => item.user_id)
              .map((item: RoverDataItem) => ({
                environment: item.environment,
                full_name: item.full_name,
                user_id: item.user_id,
                user_role: item.user_role,
                manager: item.manager,
                source: 'rover',
                account_name: item.account_name,
                app_name: item.app_name,
                period,
                frequency,
                app_delegate: item.app_delegate,
                created_at: new Date(),
              }));

            if (groupAccess.length > 0) {
              await trx('group_access_reports_fresh').insert(groupAccess);
              roverGroupAccess = groupAccess.length;
            }
          }

          // Insert GitLab data into fresh tables only
          if (gitlabData.length > 0) {
            // Handle GitLab service accounts
            const gitlabServiceAccountsData = gitlabData
              .filter((item: GitLabDataItem) => item.service_account)
              .map((item: GitLabDataItem) => ({
                app_name: item.app_name,
                environment: item.environment,
                service_account: item.service_account,
                user_role: item.user_role,
                manager: item.manager,
                app_delegate: item.app_delegate,
                source: 'gitlab',
                account_name: item.account_name,
                period,
                frequency,
                created_at: new Date(),
              }));

            if (gitlabServiceAccountsData.length > 0) {
              await trx('service_account_access_review_fresh').insert(
                gitlabServiceAccountsData,
              );
              gitlabServiceAccounts = gitlabServiceAccountsData.length;
            }

            // Handle GitLab group access
            const gitlabGroupAccessData = gitlabData
              .filter((item: GitLabDataItem) => item.user_id)
              .map((item: GitLabDataItem) => ({
                environment: item.environment,
                full_name: item.full_name,
                user_id: item.user_id,
                user_role: item.user_role,
                manager: item.manager,
                source: 'gitlab',
                account_name: item.account_name,
                app_name: item.app_name,
                period,
                frequency,
                app_delegate: item.app_delegate,
                created_at: new Date(),
              }));

            if (gitlabGroupAccessData.length > 0) {
              await trx('group_access_reports_fresh').insert(
                gitlabGroupAccessData,
              );
              gitlabGroupAccess = gitlabGroupAccessData.length;
            }
          }

          // Insert LDAP data into fresh tables only
          if (ldapData.length > 0) {
            // Handle LDAP service accounts
            const ldapServiceAccountsData = ldapData
              .filter((item: any) => item.service_account)
              .map((item: any) => ({
                app_name: item.app_name,
                environment: item.environment,
                service_account: item.service_account,
                user_role: item.user_role,
                manager: item.manager,
                app_delegate: item.app_delegate,
                source: 'ldap',
                account_name: item.account_name,
                period,
                frequency,
                created_at: new Date(),
              }));

            if (ldapServiceAccountsData.length > 0) {
              await trx('service_account_access_review_fresh').insert(
                ldapServiceAccountsData,
              );
              ldapServiceAccounts = ldapServiceAccountsData.length;
            }

            // Handle LDAP group access
            const ldapGroupAccessData = ldapData
              .filter((item: any) => item.user_id)
              .map((item: any) => ({
                environment: item.environment,
                full_name: item.full_name,
                user_id: item.user_id,
                user_role: item.user_role,
                manager: item.manager,
                source: 'ldap',
                account_name: item.account_name,
                app_name: item.app_name,
                period,
                frequency,
                app_delegate: item.app_delegate,
                created_at: new Date(),
              }));

            if (ldapGroupAccessData.length > 0) {
              await trx('group_access_reports_fresh').insert(
                ldapGroupAccessData,
              );
              ldapGroupAccess = ldapGroupAccessData.length;
            }
          }

          // Insert Manual data into fresh tables only
          if (manualData.length > 0) {
            // Handle service accounts
            const manualServiceAccountsData = manualData
              .filter((item: ManualDataItem) => item.service_account)
              .map((item: ManualDataItem) => ({
                app_name: item.app_name,
                environment: item.environment,
                service_account: item.service_account,
                user_role: item.user_role,
                manager: item.manager,
                app_delegate: item.app_delegate,
                source: 'manual',
                account_name: item.account_name,
                period,
                frequency,
                created_at: new Date(),
              }));

            if (manualServiceAccountsData.length > 0) {
              await trx('service_account_access_review_fresh').insert(
                manualServiceAccountsData,
              );
              manualServiceAccounts = manualServiceAccountsData.length;
            }

            // Handle group access
            const manualGroupAccessData = manualData
              .filter((item: ManualDataItem) => item.user_id)
              .map((item: ManualDataItem) => ({
                environment: item.environment,
                full_name: item.full_name,
                user_id: item.user_id,
                user_role: item.user_role,
                manager: item.manager,
                source: 'manual',
                account_name: item.account_name,
                app_name: item.app_name,
                period,
                frequency,
                app_delegate: item.app_delegate,
                created_at: new Date(),
              }));

            if (manualGroupAccessData.length > 0) {
              await trx('group_access_reports_fresh').insert(
                manualGroupAccessData,
              );
              manualGroupAccess = manualGroupAccessData.length;
            }
          }

          return {
            message: 'Fresh data synced successfully',
            statistics: {
              rover: {
                service_accounts: roverServiceAccounts,
                group_access: roverGroupAccess,
                total: roverServiceAccounts + roverGroupAccess,
              },
              gitlab: {
                service_accounts: gitlabServiceAccounts,
                group_access: gitlabGroupAccess,
                total: gitlabServiceAccounts + gitlabGroupAccess,
              },
              ldap: {
                service_accounts: ldapServiceAccounts,
                group_access: ldapGroupAccess,
                total: ldapServiceAccounts + ldapGroupAccess,
              },
              manual: {
                service_accounts: manualServiceAccounts,
                group_access: manualGroupAccess,
                total: manualServiceAccounts + manualGroupAccess,
              },
              total_records:
                roverServiceAccounts +
                roverGroupAccess +
                gitlabServiceAccounts +
                gitlabGroupAccess +
                ldapServiceAccounts +
                ldapGroupAccess +
                manualServiceAccounts +
                manualGroupAccess,
            },
          };
        },
      );

      // Ensure we always return a properly structured response
      return res.json(
        result || {
          message: 'Fresh data synced successfully',
          statistics: {
            rover: {
              service_accounts: 0,
              group_access: 0,
              total: 0,
            },
            gitlab: {
              group_access: 0,
              total: 0,
            },
            total_records: 0,
          },
        },
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error('Failed to sync fresh data', { error: errorMessage });
      return res.status(500).json({
        error: 'Failed to sync fresh data',
        message: errorMessage,
        statistics: {
          rover: {
            service_accounts: 0,
            group_access: 0,
            total: 0,
          },
          gitlab: {
            group_access: 0,
            total: 0,
          },
          total_records: 0,
        },
      });
    }
  });
  return dataSyncRouter;
}
