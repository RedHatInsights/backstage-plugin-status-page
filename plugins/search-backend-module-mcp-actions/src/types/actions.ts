/**
 * Action input and output types
 */

export type ActionErrorResponse = {
  isError: true;
  error: string;
};

export type ActionSuccessResponse<T> = {
  isError?: false;
} & T;

export type ActionResponse<T> = ActionSuccessResponse<T> | ActionErrorResponse;

export type SearchCatalogInput = {
  term: string;
  types?: string[];
  filters?: Record<string, string | string[]>;
  limit?: number;
};

