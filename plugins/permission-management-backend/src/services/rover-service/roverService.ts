import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';

/**
 * Interface representing the structure of user information returned by Rover.
 */
interface UserInfoResponse {
    result?: any;
}

/**
 * Extract UID from a DN string (e.g., "uid=abc,ou=Users,dc=example,dc=com").
 */
const extractUid = (dn: string): string | null =>
    dn?.startsWith('uid=') ? dn.split(',')[0].split('=')[1] : null;

/**
 * Headers used for Rover API requests.
 */
const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'Backstage-Plugin',
};

/**
 * A lightweight class to interact with Rover API without DB dependency.
 */
export class RoverClient {
    private readonly roverUsername: string;
    private readonly roverPassword: string;
    private readonly roverBaseUrl: string;
    private readonly roverBaseUrlV2: string;
    private readonly logger: LoggerService;


    constructor(config: RootConfigService, logger: LoggerService) {
        this.roverUsername = config.getOptionalString('permissionManagement.roverUsername') || '';
        this.roverPassword = config.getOptionalString('permissionManagement.roverPassword') || '';
        this.roverBaseUrl = config.getOptionalString('permissionManagement.roverBaseUrl') || '';
        this.roverBaseUrlV2 = config.getOptionalString('permissionManagement.roverBaseUrlV2') || '';
        this.logger = logger;
    }

    private getAuthHeader(): { Authorization: string } {
        return {
            Authorization: `Basic ${Buffer.from(
                `${this.roverUsername}:${this.roverPassword}`,
            ).toString('base64')}`,
        };
    }

    /**
     * Fetch user details from Rover by UID.
     */
    async getUserInfo(uid: string): Promise<any | null> {
        const url = `${this.roverBaseUrl}/users/${uid}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { ...headers, ...this.getAuthHeader() },
            });
            if (!response.ok) return null;
            const data = (await response.json()) as UserInfoResponse;
            return data.result ?? null;
        } catch (e) {
            this.logger.warn(`Failed to fetch user info for UID ${uid}: ${e}`);
            return null;
        }
    }

    /**
     * Fetch member and owner UIDs for a Rover group.
     */
    async getGroupMembersAndOwners(groupCn: string, bearerToken: string): Promise<{
        memberUids: string[];
        ownerUids: string[];
    }> {
        const url = `${this.roverBaseUrlV2}/v1/groups/${groupCn}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    ...headers,
                    Authorization: `Bearer ${bearerToken}`,
                },
            });
            const data = (await response.json());
            const groups = data ?? [];
            if (!groups) return { memberUids: [], ownerUids: [] };

            const memberUids = (groups.members || [])
                .map((member: any) => member.id)
                .filter(Boolean) as string[];

            const ownerUids = (groups.owners || [])
                .map((owner: any) => owner.id)
                .filter(Boolean) as string[];

            return { memberUids, ownerUids };
        } catch (e) {
            this.logger.warn(`Failed to fetch group info for ${groupCn}: ${e}`);
            return { memberUids: [], ownerUids: [] };
        }
    }

    /**
     * Get combined user details for a group (members and owners).
     */
    async getGroupAccessReport(groupCn: string, bearerToken: string): Promise<any[]> {
        const { memberUids, ownerUids } = await this.getGroupMembersAndOwners(groupCn, bearerToken);
        const allUids = Array.from(new Set([...memberUids, ...ownerUids]));

        const report: any[] = [];

        for (const uid of allUids) {
            const user = await this.getUserInfo(uid);
            if (!user) continue;

            let role = 'N/A';
            if (memberUids.includes(uid) && ownerUids.includes(uid)) {
                role = 'owner, member';
            } else if (memberUids.includes(uid)) {
                role = 'member';
            } else if (ownerUids.includes(uid)) {
                role = 'owner';
            }

            const managerUid = extractUid(user.manager || '');
            const managerInfo = managerUid ? await this.getUserInfo(managerUid) : null;

            report.push({
                full_name: user.cn,
                user_id: user.uid,
                user_role: role,
                manager: managerInfo?.cn || managerUid || '',
                manager_uid: managerUid || '',
            });
        }

        return report;
    }

    /**
     * Add users to a specific Rover group in the **Production** environment.
     *
     * This method sends a POST request to the Rover group management API to add multiple users
     * to the given group. The Bearer token is received from the frontend and used for authorization.
     *
     * @param groupCn - The common name (CN) of the Rover group to which users are to be added.
     * @param userIds - An array of user IDs (UIDs) to be added to the group.
     * @param bearerToken - The Bearer token for authorization, passed from the frontend.
     * 
     * @returns A promise that resolves to `true` if the users were successfully added,
     *          or `false` if the request failed.
     */
    async addUsersToGroupOwners(groupCn: string, userIds: string[], bearerToken: string): Promise<boolean> {
        const url = `${this.roverBaseUrlV2}/${groupCn}/ownersMod`;
        const body = {
            additions: userIds.map(id => ({ type: 'user', id })),
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...headers,
                    Authorization: `Bearer ${bearerToken}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                this.logger.warn(`Failed to add users to group [PROD]: ${groupCn}, status: ${response.status}`);
                return false;
            }

            return true;
        } catch (e) {
            this.logger.error(`Error adding users to group [PROD] ${groupCn}: ${e}`);
            return false;
        }
    }

    /**
     * Add users to a specific Rover group in the **Preproduction** environment.
     *
     * This method sends a POST request to the Preprod Rover group API to add multiple users
     * using a Bearer token provided by the frontend.
     *
     * @param groupCn - The common name (CN) of the Rover group to which users are to be added.
     * @param userIds - An array of user IDs (UIDs) to be added to the group.
     * @param bearerToken - The Bearer token for authorization, passed from the frontend.
     * 
     * @returns A promise that resolves to `true` if the users were successfully added,
     *          or `false` if the request failed.
     */
    async addUsersToGroupMember(groupCn: string, userIds: string[], bearerToken: string): Promise<boolean> {
        const url = `${this.roverBaseUrlV2}/${groupCn}/membersMod`;
        const body = {
            additions: userIds.map(id => ({ type: 'user', id })),
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...headers,
                    Authorization: `Bearer ${bearerToken}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                this.logger.warn(`Failed to add users to group [PREPROD]: ${groupCn}, status: ${response.status}`);
                return false;
            }

            return true;
        } catch (e) {
            this.logger.error(`Error adding users to group [PREPROD] ${groupCn}: ${e}`);
            return false;
        }
    }


}
