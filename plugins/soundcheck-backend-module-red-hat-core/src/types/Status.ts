'use strict';

import {
  Severity
} from "../enums/Severity";

/**
 * Type to define properties of statuses from the Red Hat Core status API.
 */
export type Status = {

  /**
   * Requirement ID.
   *
   * Can contain spaces, e.g., "update access" or "file system".
   *
   * @type {string}
   */
  id: string;

  /**
   * Requirement human-friendly title.
   *
   * @type {string}
   */
  title: string;

  /**
   * Requirement value.
   *
   * Can be an empty string.
   *
   * @type {string}
   */
  value: string;

  /**
   * Severity level from -1 "info" to 2 "warning".
   *
   * @see https://api.drupal.org/api/drupal/core%21includes%21install.inc/11.x
   */
  severity: Severity;

}
