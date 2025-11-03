import { ajvCompiledJsonSchemaValidator } from './utils';
import datasourceSchema from '../schema/resource.v1.schema.json';

export const datasourceEntityValidator =
  ajvCompiledJsonSchemaValidator(datasourceSchema);
