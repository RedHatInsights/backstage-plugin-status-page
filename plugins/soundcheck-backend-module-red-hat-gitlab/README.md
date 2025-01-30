# Red Hat GitLab fact collector

This module is an extension for the [Soundcheck][soundcheck] plugin.

It provides a [fact collector][soundcheck-fact-collector] that collects
information from GitLab that is not provided by
the [GitLab fact collector built-in to Soundcheck][soundcheck-gitlab-fact-collector]:

* Code coverage (from the [GitLab Pipelines API][gitlab-pipelines-api])
* [Composer][php-composer] lock file modification time
* [Environments][gitlab-environments]
* Latest [pipeline][gitlab-pipelines]
* [Shared stages][red-hat-gitlab-shared] usage

## Prerequisites

The [Backstage GitLab integration][backstage-gitlab-integration] must be
configured before this module will work:

```yaml
# app-config.yaml

integrations:
  gitlab:
    - host: gitlab.cee.redhat.com
      token: ${GITLAB_CEE_TOKEN}
      apiBaseUrl: https://gitlab.cee.redhat.com/api/v4
```

## Installation

In the root directory of your Backstage project, run:

```shell
yarn workspace backend add @appdev-platform/backstage-plugin-soundcheck-backend-module-red-hat-gitlab
```

Add the module to the backend:

```typescript
// packages/backend/src/index.ts

const backend = createBackend();

// ...

backend.add(import('@appdev-platform/backstage-plugin-soundcheck-backend-module-red-hat-gitlab'));
```

## Examples

### Fact explorer

![A screenshot of the Fact Explorer modal, with the red-hat-gitlab integration and code_coverage fact selected. The JSON schema section and sample fact sections are expanded and a sample has been fetched successfully.](./docs/fact-explorer.png)

[backstage-gitlab-integration]: https://backstage.io/docs/integrations/gitlab/locations/

[gitlab-environments]: https://docs.gitlab.com/ee/ci/environments/

[gitlab-pipelines]: https://docs.gitlab.com/ee/ci/pipelines/index.html

[gitlab-pipelines-api]: https://docs.gitlab.com/ee/api/pipelines.html

[php-composer]: https://getcomposer.org/

[red-hat-gitlab-shared]: https://gitlab.cee.redhat.com/dxp/dat/gitlab-shared

[soundcheck]: https://backstage.spotify.com/marketplace/spotify/plugin/soundcheck/

[soundcheck-fact-collector]: https://backstage.spotify.com/docs/plugins/soundcheck/core-concepts/fact-collectors/

[soundcheck-gitlab-fact-collector]: https://backstage.spotify.com/docs/plugins/soundcheck/core-concepts/fact-collectors/3p-integrations/gitlab
