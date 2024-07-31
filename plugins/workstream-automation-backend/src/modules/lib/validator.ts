import { ajvCompiledJsonSchemaValidator } from './utils';
import schema from '../schema/WorkstreamData.v1alpha1.schema.json';

export const workstreamDataV1alpha1Validator =
  ajvCompiledJsonSchemaValidator(schema);
