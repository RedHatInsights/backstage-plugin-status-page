/** GDPR Frontend Types */

/** Platform enum matching backend */
export enum Platform {
  DCP = 'dcp',
  DXSP = 'dxsp',
  CPPG = 'cppg',
  CPHUB = 'cphub',
}

/** User role structure */
export interface UserRole {
  target_id: string;
  target_type: string;
  target_uuid: string;
  url?: string;
}

/** User data from API */
export interface GdprUser {
  uid: string;
  name: string;
  mail?: string;
  roles?: UserRole[];
  rh_jwt_user_id: string;
  created?: string;
  changed?: string;
  status?: string;
  timezone?: string;
  language?: string;
  access?: string;
  login?: string;
  path?: {
    langcode: string;
  };
  field_avatar_path?: string;
  field_first_name?: string;
  field_last_name?: string;
}

/** Content data from API */
export interface GdprContent {
  comment?: number;
  file?: number;
  node?: number;
  media?: number;
  group?: number;
  group_relationship?: number;
  content_moderation_state?: number;
  cphub_alert?: number;
  super_sitemap_custom_url?: number;
  rhlearn_progress?: number;
  red_hat_feedback_option?: number;
  red_hat_feedback_response?: number;
  red_hat_feedback_topic?: number;
  paragraph?: number;
  menu_link_content?: number;
  taxonomy_term?: number;
}

/** Raw API response structure */
export interface GdprApiResponse {
  platform: Platform;
  user: GdprUser;
  subscription_user?: GdprUser | null;
  content: GdprContent;
  code?: number;
  status: string;
  message?: string;
}

/** Formatted table data */
export interface GdprTableData {
  platform: Platform;
  uid?: string;
  username: string;
  ssoId: string;
  roles: string;
  comment: string;
  file: string;
  node: string;
  rhlearnId: string;
  media: string;
  group?: string;
  group_relationship?: string;
  content_moderation_state?: string;
  cphub_alert?: string;
  super_sitemap_custom_url?: string;
  rhlearn_progress?: string;
  red_hat_feedback_option?: string;
  red_hat_feedback_response?: string;
  red_hat_feedback_topic?: string;
  firstName?: string;
  lastName?: string;
  avatarPath?: string;
  created?: string;
  changed?: string;
}

/** Delete request payload */
export interface DeleteRequest {
  uid: string;
  platform: Platform;
}

/** Delete response structure */
export interface DeleteResponse {
  uid: string;
  platform: Platform;
  success: boolean;
  data?: {
    deletedRecords: number;
    affectedTables: string[];
    timestamp: string;
  };
  error?: string;
}

/** Form data structure */
export interface GdprFormData {
  email: string;
  ssoUsername: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  ticketId: string;
  drupalUsername: string;
  drupalUid: string;
  ssoId: string;
}

/** Search options */
export interface SearchOptions {
  searchType: 'All System' | 'Drupal';
  includeContent: boolean;
  includeRoles: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

/** Loading state */
export interface LoadingState {
  isLoading: boolean;
  operation?: 'search' | 'delete' | 'download' | 'bulk-delete';
  progress?: number;
  message?: string;
}

/** Error state */
export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: number;
  details?: Record<string, any>;
}
