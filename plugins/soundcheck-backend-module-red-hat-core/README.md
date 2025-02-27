# Red Hat Core fact collector

This module is an extension for the [Soundcheck][soundcheck] plugin.

It provides a [fact collector][soundcheck-fact-collector] that collects
information from [Drupal][drupal] sites using
the [Red Hat Core module for Drupal][red-hat-core].

## Prerequisites

Entities must have the CMDB app code metadata annotation in order to be paired
with a shared secret token. When getting facts, the CMDB app code from the
configuration is matched with the CMDB app code in an entity's metadata
annotations:

```yaml
# /catalog/uxe/component/dx-adds

apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  annotations:
    # ...
    servicenow.com/appcode: ADDS-001
    # ...
```

## Installation

In the root directory of your Backstage project, run:

```shell
yarn workspace backend add @appdev-platform/backstage-plugin-soundcheck-backend-module-red-hat-core
```

Add the module to the backend:

```typescript
// packages/backend/src/index.ts

const backend = createBackend();

// ...

backend.add(import('@appdev-platform/backstage-plugin-soundcheck-backend-module-red-hat-core'));
```

## Configuration

To access the APIs provided by [Red Hat Core][red-hat-core], this module will
need a shared secret token set up by
[each Drupal site][red-hat-experience-platform-drupal-platforms]. Configure
the sites:

```yaml
# app-config.yaml

soundcheck:
  collectors:
    redHatCore:
      platforms:
        - appCode: ADDS-001
          token: ${RED_HAT_CORE_TOKEN_ADDS_001}
```

Set up environment variables to hold the tokens:

```shell
# .env

RED_HAT_CORE_TOKEN_ADDS_001="[token]"
```

Make sure to load environment variables before starting the yarn server.

## Facts

### Status

[Drupal][drupal] provides a status report page in the administrative interface.
Any Drupal module, theme, plugin, or Drupal itself can add information this
status page and set an associated severity, "info", "ok", "warning", or "error".
Red Hat Core exposes this information in a simple API:

```json
{
  "statuses": [
    ...
    {
      "id": "drupal",
      "title": "Drupal",
      "value": "11.1.2",
      "severity": -1
    },
    ...
  ]
}
```

This can be used in a check with the
default [JSONPath][jsonpath] [path resolver][soundcheck-path-resolvers]:

```jsonpath
$.statuses[?(@.id == "php")].value
```

[drupal]: http://drupal.org/

[jsonpath]: https://www.rfc-editor.org/rfc/rfc9535.html

[red-hat-core]: https://gitlab.cee.redhat.com/dxp/dat/red_hat_core

[red-hat-experience-platform-drupal-platforms]: https://console.one.redhat.com/catalog?filters%5Bkind%5D=component&filters%5Btags%5D=drupal-platform&filters%5Buser%5D=all&limit=20

[soundcheck]: https://backstage.spotify.com/marketplace/spotify/plugin/soundcheck/

[soundcheck-fact-collector]: https://backstage.spotify.com/docs/plugins/soundcheck/core-concepts/fact-collectors/

[soundcheck-path-resolvers]: https://backstage.spotify.com/docs/plugins/soundcheck/core-concepts/checks#path-resolvers
