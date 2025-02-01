'use strict';

/**
 * Type to define the relevant parts of a component URL.
 */
export type ParsedComponent = {

  /**
   * Component name.
   *
   * @type string
   */
  componentName: string;

  /**
   * Component version.
   *
   * @type string
   */
  componentVersion: string;

  /**
   * Project name.
   *
   * @type string
   */
  projectName: string;

}
