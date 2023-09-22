# Backstage Plugins by AppDev Platform

This repository contains the custom plugins used and developed by the AppDev Platform team.

> Inspired by https://github.com/janus-idp/backstage-plugins

## Suggesting a plugin

If you have a use case for a new plugin, please create [a new issue](/issues/new) in this repository, as well as [a new issue in the upstream](https://github.com/janus-idp/backstage-plugins/issues/new?template=plugin.md).

## Creating a new plugin

Run the following command to start a new plugin and follow the instructions:

```
yarn new
```

> Before developing your plugins please read the [Releasing packages](#release-packages) section of this readme. It will help you understand versioning, commit messages and publishing process.

## Develop a new plugin together with a local backstage instance

Backstage's support for standalone plugin development is very limited (especially for backend plugins), therefore we include a minimal test instance within this repository.

1. Install the plugin via `yarn workspace [app|backend] add @appdev-platform/<PLUGIN_NAME>@*` (`@*` at the end ensures the package is always linked to the local package in the `plugins` folder)
2. Run `yarn start`

### Developing a frontend plugin

In case your plugin supports standalone mode, you can use `yarn start` command in your plugin directory directly and you don't have to install the plugin as mentioned above.

### Plugin specific config file

You can augment the configuration for a plugin by running `yarn start --config <CONFIG_FILE>`.

## Releasing packages

### Configuration

1. `private: true` in the `package.json` ensures the package **is released to Git/GitHub only**. The package **is not released to NPM**.
2. You can use the [`publishConfig` key](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#publishconfig) in the `package.json` to influence NPM registry settings.

To make your package eligible for release automation and publicly available in NPM registry, please make sure your `package.json` contains following:

```diff
  {
-  "private": true,
...
+   "publishConfig": {
+     "access": "public"
+   }
  }
```

### Requirements

We use [semantic-release](https://semantic-release.gitbook.io/semantic-release/) (together with [multi-semantic-release](https://github.com/dhoulb/multi-semantic-release)).

Please read [following guidelines](https://semantic-release.gitbook.io/semantic-release/#commit-message-format) to learn, how to format your commit messages:

| Commit message                                                                                                                                                                                        | Release type                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| <pre>fix(pencil): stop graphite breaking when too much pressure applied</pre>                                                                                                                         | Fix Release (`vX.Y.⬆️` )                                                                                          |
| <pre>feat(pencil): add 'graphiteWidth' option</pre>                                                                                                                                                   | Feature Release (`vX.⬆️.0`)                                                                                       |
| <pre>perf(pencil): remove graphiteWidth option<br><br>BREAKING CHANGE: The graphiteWidth option has been removed.<br>The default graphite width of 10mm is always used for performance reasons.</pre> | Breaking Release (`v⬆️.0.0`) <br>(Note that the `BREAKING CHANGE:` token must be **in the footer** of the commit) |

Commit messages are used to populate a `CHANGELOG.md` file for each individual package (if the commit is relevant for that particular package folder).

# Running e2e Tests in playwright

UI tests for Red Hat Experience Platform Plugin using Playwright

## Pre-requisites

NodeJs

## Setup

- Setup Environment variables and other authentication related info

```
source playwright/set-env.sh
```

## Execute tests:

- For headless execution:

```sh
npx playwright test
```

## Execute single test:

```sh
npx playwright test <testfilename.js>
```

## Open the playright runner

npx playwright codegen

## Reports

`Report Portal has been configured`

- https://reportportal-hydra.apps.ocp-c1.prod.psi.redhat.com/ui/#backstage_plugins_tests/dashboard/72

