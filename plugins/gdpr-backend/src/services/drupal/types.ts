
import { UserData, DeleteUserDataRequest, DeleteResult, FetchUserDataRequest } from '../../lib/types';

/**
 * @deprecated Legacy interface - kept for compatibility
 * Use the types from ../../lib/types instead
 */
export interface DrupalItem {
  title: string;
  id: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Service interface for GDPR Drupal operations
 */
export interface DrupalService {
  /**
   * Fetches user data from both DCP and DXSP platforms
   */
  fetchUserData(request: FetchUserDataRequest): Promise<UserData[]>;

  /**
   * Deletes user data from specified platforms
   */
  deleteUserData(requests: DeleteUserDataRequest[]): Promise<DeleteResult[]>;
}
