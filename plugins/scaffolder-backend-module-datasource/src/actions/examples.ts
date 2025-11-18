import { TemplateExample } from '@backstage/plugin-scaffolder-node';
import yaml from 'yaml';

export const createDatasourceExample: TemplateExample[] = [
  {
    description: 'Create datasource entity directly in compass',
    example: yaml.stringify({
      steps: [
        {
          id: 'create',
          name: 'Create & Register Datasource',
          if: "${{ steps['validate'].output.valid }}",
          action: 'datasource:create',
          input: {
            name: '${{ parameters.name if parameters.name else parameters.title | kebabCase }}',
            title: '${{ parameters.title }}',
            namespace: '${{ parameters.namespace }}',
            description: '${{ parameters.description }}',
            aiRelated: '${{ "true" if parameters.aiRelated else "false" }}',
            owner: '${{ parameters.owner }}',
            steward: '${{ parameters.steward }}',
            type: '${{ parameters.type }}',
            usage: '${{ parameters.usage }}',
            location: '${{ parameters.location }}',
            classification: '${{ parameters.classification }}',
            existsIn: '${{ parameters.existsIn }}',
            system: '${{ parameters.system }}',
            dependencyOf: '${{ parameters.dependencyOf }}',
            dependsOn: '[]',
            tags: '[]',
            cmdbAppCode: '${{ parameters.cmdbAppCode }}',
          },
        },
      ],
    }),
  },
];
