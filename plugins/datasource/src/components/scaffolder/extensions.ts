import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import { EntityFacetPicker } from './fields/EntityFacetPicker';
import { EntityFacetPickerSchema } from './fields/EntityFacetPicker/schema';

export const EntityFacetPickerFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    component: EntityFacetPicker,
    name: 'EntityFacetPicker',
    schema: EntityFacetPickerSchema,
  }),
);
