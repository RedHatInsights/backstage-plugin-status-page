/** Supported GDPR platforms */
export enum Platform {
  DCP = 'dcp',
  DXSP = 'dxsp',
}

/** Configuration for a Drupal host */
export interface DrupalHostConfig {
  token: string;
  apiBaseUrl: string;
  serviceAccount: string;
}

/** GDPR configuration containing both DCP and DXSP configs */
export interface GdprConfig {
  dcp: DrupalHostConfig;
  dxsp: DrupalHostConfig;
}

/** Request for fetching user data */
export interface FetchUserDataRequest {
  id: string;
}

/** Request for deleting user data */
export interface DeleteUserDataRequest {
  uid: string;
  platform: Platform;
}

/** User data structure */
export interface User {
  [key: string]: unknown;
  roles?: Record<string, unknown> | Record<string, unknown>[] | unknown[];
}

/** Formatted user data response */
export interface UserData {
  platform: Platform;
  user: User;
  content: unknown[];
  code: number;
  status: string;
}

/** Result of a delete operation */
export interface DeleteResult {
  uid: string;
  platform: Platform;
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Custom error for GDPR operations */
export class GdprError extends Error {
  constructor(
    message: string,
    public readonly platform: Platform,
    public readonly statusCode?: number,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'GdprError';
  }
}
