import { ajvCompiledJsonSchemaValidator } from './utils';
import schema from '../schema/McpRegistry.v1alpha1.schema.json';

export const mcpServerValidator =
  ajvCompiledJsonSchemaValidator(schema);