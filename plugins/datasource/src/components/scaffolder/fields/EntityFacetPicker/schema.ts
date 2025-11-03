/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { makeFieldSchema } from '@backstage/plugin-scaffolder-react';

/**
 * @public
 */
export const EntityFacetPickerFieldSchema = makeFieldSchema({
  output: z => z.string().or(z.array(z.string())),
  uiOptions: z =>
    z.object({
      facet: z
        .string()
        .describe(
          'Which facet path to use for picker options, for eg: metadata.namespace',
        ),
      kinds: z
        .array(z.string())
        .optional()
        .describe('List of kinds of entities to derive tags from'),
      showCounts: z
        .boolean()
        .optional()
        .describe('Whether to show usage counts per tag'),
      multiple: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether it accepts multiple values'),
    }),
});

export const EntityFacetPickerSchema = EntityFacetPickerFieldSchema.schema;

export type EntityFacetPickerProps = typeof EntityFacetPickerFieldSchema.TProps;

/**
 * The input props that can be specified under `ui:options` for the
 * `EntityFacetPicker` field extension.
 * @public
 */
export type EntityFacetPickerUiOptions = NonNullable<
  (typeof EntityFacetPickerFieldSchema.TProps.uiSchema)['ui:options']
>;
