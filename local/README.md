# Local Dev setup recommendations for Soundcheck
Follow development guide at
https://backstage.spotify.com/docs/plugins/soundcheck/tutorials/custom-fact-collector


1. (Required) Set up your .env file  
Copy the root .env.example to .env, check the REPLACE_ME options and replace them as needed.  

2. (Required) Set up your app-config.local.yaml  
Copy the `./local/app-config.local.yaml.example` to the root as app-config.local.yaml, make changes as needed.
Check if any changes to the field mappings for CMDB in Backstage repo.
```yml
catalog:
  providers:
    cmdb:
      appdevPlatform:
        customMappings: []
```

3. (Optional) Modify soundcheck configuration  
Depending on your needs, you may want to reference local soundcheck checks/programs rather than fetch remotely.  
See the Soundcheck config in app-config.local.yaml and use it along with the modified yarn command below.  
Note this excludes the root ./soundcheck-config.yaml so that you can iterate over yaml files locally instead of the Soundcheck Config repository.  

```bash
yarn workspaces foreach -A --include backend --include app --parallel --jobs unlimited -v -i run start --config ../../app-config.yaml --config ../../app-config.local.yaml"
```

4. Run the app
```bash
yarn install
yarn dev
```

## Soundcheck Fact Collectors
```
yarn new 
option 3: a plugin based on a module 
plugin name: soundcheck
module name:  red-hat-mymodule
```

## Post module plugin checklist 
- Update `packages/backend/package.json`. Change the new required app version to `*`.
- Update the `packages/backend/src/index.ts` to keep the Soundcheck packages together, preferrably alphabetically.
- Remove the private tag from your new module's package.json metadata.
- Fix package metadata `yarn backstage-cli repo fix --publish`
- Require Backstage packages for plugin as needed:

```zsh
yarn --cwd ./plugins/red-hat-mymodule add @backstage/catalog-model @backstage/config @backstage/types @spotify/backstage-plugin-soundcheck-common @spotify/backstage-plugin-soundcheck-node 
```

- Update the module's README for required configuration
- Include any new secrets in `/openshift/encrypted-secrets.yaml` to `stringData` for unencrypted values, and `data` for encryped values.
