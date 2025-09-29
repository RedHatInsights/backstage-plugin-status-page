
import { 
  UserData, 
  DeleteUserDataRequest, 
  DeleteResult, 
  FetchUserDataRequest,
  FetchUserDataByUsernameRequest,
  FetchUserDataByEmailRequest
} from '../../lib/types';

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
   * Fetches user data from both DCP and DXSP platforms (Legacy with fallback)
   */
  fetchUserData(request: FetchUserDataRequest): Promise<UserData[]>;

  /**
   * Fetches user data by username only - no fallback to email
   */
  fetchUserDataByUsername(request: FetchUserDataByUsernameRequest): Promise<UserData[]>;

  /**
   * Fetches user data by email only - no fallback to username
   */
  fetchUserDataByEmail(request: FetchUserDataByEmailRequest): Promise<UserData[]>;

  /**
   * Deletes user data from specified platforms
   */
  deleteUserData(requests: DeleteUserDataRequest[]): Promise<DeleteResult[]>;
}
