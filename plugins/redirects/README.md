# Redirects Plugin for Backstage

The **Redirects** plugin provides a way to manage and configure URL redirects within your Backstage instance. This is useful for maintaining legacy links, handling route changes, and improving user navigation across your Backstage portal.

## Features
- Centralized management of URL redirects
- Support for static and dynamic redirect rules
- Easy integration with Backstage frontend
- Configurable via Backstage configuration files

## Installation

1. Add the plugin to your Backstage project:
   ```sh
   yarn workspace app add @compass/backstage-plugin-redirects
   ```

2. Add the plugin to your Backstage app:
   - Import the `RedirectsProvider` to your App root `packages/app/src/App.tsx`
   - Configure the external route bindings

```diff
+ import {
+   redirectsPlugin,
+   RedirectsProvider,
+ } from '@compass/backstage-plugin-redirects';

// ...

const app = createApp({
  // ...
  bindRoutes({ bind }) {
    // ...
+    bind(redirectsPlugin.externalRoutes, {
+      techDocsDetails: techdocsPlugin.routes.docRoot,
+      catalogDetails: catalogPlugin.routes.catalogEntity,
+    });
  }
});

export default app.createRoot(
  <>
    <AlertDisplay />
    <AppRouter>
+      <RedirectsProvider>
        <Root>{routes}</Root>
+      </RedirectsProvider>
    </AppRouter>
  </>,
);

```

## Configuration

Add redirect rules to your Backstage configuration (e.g., `app-config.yaml`):

```yaml
app:
  redirects:
    rules:
      # when an entity is renamed / replaced
      - type: entity
        from: component:default/old-component
        to: component:default/new-component
        message: Redirection Message
      # redirects an entity to a direct path
      - type: entity
        from: component:default/example-component
        to: /new-page
        message: Redirection test
      # redirects an old path to a new path
      - type: url
        from: /old-path
        to: /new-path
```

## Usage

Once configured, users navigating to a redirected URL will be automatically sent to the new destination according to your rules.

## Development

- To run or test the plugin locally, start the backstage instance dev server:
  ```sh
  yarn dev
  ```
