import { ajvCompiledJsonSchemaValidator } from './utils';
import v1Alpha1Schema from '../schema/McpRegistry.v1alpha1.schema.json';
import v1Beta1Schema from '../schema/MCPServer.v1beta1.schema.json';

export const mcpServerValidatorAlpha =
  ajvCompiledJsonSchemaValidator(v1Alpha1Schema);

export const mcpServerValidatorBeta =
  ajvCompiledJsonSchemaValidator(v1Beta1Schema);
