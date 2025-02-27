'use strict';

/**
 * List of possible requirement severities from Drupal.
 *
 * @see https://api.drupal.org/api/drupal/core%21includes%21install.inc/11.x
 */
export enum Severity {

  Info = -1,
  Ok = 0,
  Warning = 1,
  Error = 2,

}
