import express from 'express';
import { RoverClient } from '../services/rover-service/roverService';

/**
 * Creates router for interacting with Rover group data.
 *
 * @param roverClient - Instance of RoverClient
 * @returns Express router
 */
export function createRoverRoutes(roverClient: RoverClient): express.Router {
  const router = express.Router();
  router.use(express.json());

  /**
   * GET /:groupCn/report
   * Fetch access report for a given group.
   *
   * @route GET /:groupCn/report
   * @param {string} groupCn - Rover group CN
   * @returns {Object[]} 200 - Access report (members + owners)
   */
  router.get('/:groupCn/report', async (req, res) => {
    const { groupCn } = req.params;
    try {
      const authHeader = req.headers.hydra_token as string || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

      if (!bearerToken) {
        return res.status(401).json({ error: 'Missing or invalid Authorization Bearer token' });
      }
      const report = await roverClient.getGroupAccessReport(groupCn, bearerToken);
      return res.status(200).json({ report });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * GET /user/:uid
   * Fetch user details from Rover by UID.
   *
   * @route GET /user/:uid
   * @param {string} uid - User ID
   * @returns {Object} 200 - User info object
   */
  router.get('/user/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
      const userInfo = await roverClient.getUserInfo(uid);
      if (!userInfo) {
        return res.status(404).json({ error: `User not found for UID: ${uid}` });
      }

      return res.status(200).json({ user: userInfo });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * GET /group/:groupCn
   * Fetch member and owner UIDs for a Rover group.
   *
   * @route GET /group/:groupCn
   * @param {string} groupCn - Group Common Name
   * @returns {Object} 200 - Object with memberUids and ownerUids
   */
  router.get('/group/:groupCn', async (req, res) => {
    const { groupCn } = req.params;

    try {
      const authHeader = req.headers.hydra_token as string || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

      if (!bearerToken) {
        return res.status(401).json({ error: 'Missing or invalid Authorization Bearer token' });
      }

      const { memberUids, ownerUids } = await roverClient.getGroupMembersAndOwners(groupCn, bearerToken);
      return res.status(200).json({ memberUids, ownerUids });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * POST /:groupCn/add-users/prod
   * Add users to a group (Production environment).
   *
   * @route POST /:groupCn/add-users/prod
   * @param {string[]} req.body.userIds - UIDs to be added
   * @param {string} req.headers.authorization - Bearer token
   * @returns {Object} 200/500 - Result
   */
  router.post('/:groupCn/add-users/owner', async (req, res) => {
    const { groupCn } = req.params;
    const { userIds } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Missing Bearer token or userIds[]' });
    }

    try {
      const success = await roverClient.addUsersToGroupOwners(groupCn, userIds, token);
      return res.status(success ? 200 : 500).json({ success });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * POST /:groupCn/add-users/preprod
   * Add users to a group (Preproduction environment).
   *
   * @route POST /:groupCn/add-users/preprod
   * @param {string[]} req.body.userIds - UIDs to be added
   * @param {string} req.headers.authorization - Bearer token
   * @returns {Object} 200/500 - Result
   */
  router.post('/:groupCn/add-users/member', async (req, res) => {
    const { groupCn } = req.params;
    const { userIds } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Missing Bearer token or userIds[]' });
    }

    try {
      const success = await roverClient.addUsersToGroupMember(groupCn, userIds, token);
      return res.status(success ? 200 : 500).json({ success });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}
