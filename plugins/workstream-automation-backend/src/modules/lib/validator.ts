import { ajvCompiledJsonSchemaValidator } from './utils';
import workstreamSchema from '../schema/WorkstreamData.v1alpha1.schema.json';
import artSchema from '../schema/ArtEntity.schema.json';

export const workstreamEntityValidator =
  ajvCompiledJsonSchemaValidator(workstreamSchema);

export const artEntityValidator = ajvCompiledJsonSchemaValidator(artSchema);
