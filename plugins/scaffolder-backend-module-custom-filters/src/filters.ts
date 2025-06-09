import { createTemplateFilter } from '@backstage/plugin-scaffolder-node/alpha';
import { JsonValue } from '@backstage/types';
import * as _ from 'lodash';

export const kebabCaseFilter = createTemplateFilter({
  id: 'kebabCase',
  description: 'Converts string to kebab case.',
  schema: z => 
    z.function(
      z.tuple([
        z.string().describe('input'),
      ]),
      z.string(),
    ),
  filter(str: JsonValue) {
    return _.kebabCase(str?.toString());
  }
});

export const startsWithFilter = createTemplateFilter({
  id: 'startsWith',
  description: 'Returns true if the given input string starts with the given substring. Otherwise returns false.',
  schema: z => 
    z.function(
      z.tuple([
        z.string().describe('input'),
        z.string().describe('substring'),
      ]),
      z.boolean(),
    ),
  filter(str: JsonValue, substr: JsonValue) {
    return str?.toString().startsWith(substr!.toString()) ?? false;
  }
});

export default [
  kebabCaseFilter,
  startsWithFilter,
];
