/**
 * Type to define properties of the Droperator version endpoint response.
 */
export type DroperatorResponse = {

  /**
   * App name, e.g., 'foo-bar'.
   *
   * @type string
   */
  APP_NAME: string;

  /**
   * App CMDB code, e.g., 'FOO-001'.
   *
   * @type string
   */
  DROP_CMDB_CODE: string;

  /**
   * Droperator version, e.g., '2.0.0'.
   *
   * @type string
   */
  DROP_PIPELINE_VERSION: string;

  /**
   * Git ref, e.g., 'main'.
   *
   * @type string
   */
  GIT_REF: string;

  /**
   * Git SHA, e.g., '1a2b3c4d'.
   *
   * @type string
   */
  GIT_SHA: string;

};
