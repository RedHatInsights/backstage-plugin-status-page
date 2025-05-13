# Status Page Dynamic Plugin

An RHDH-hosted plugin for monitoring incidents and updating components on status.redhat.com directly. This mono-repo was created using `@backstage/create-app` to provide a backend and frontend for the plugin to integrate with.

You can find the plugin code in `plugins/status-page`.

## Development
To start the app, run the following:
```
yarn install
yarn start
```

In your local browser, navigate to `http://localhost:3000/status-page`.
## Configuration
In `app-config.yaml`, declare the proxy endpoint variables `STATUSPAGE_URL` and `STATUSPAGE_AUTH` - this will allow the plugin to query incident and component info from the Status Red Hat API.

```
proxy:
  endpoints:
    '/statuspage':
      target: ${STATUSPAGE_URL}
      headers:
        Authorization: ${STATUSPAGE_AUTH}
```

For local development, developers will need to use a mock Atlassian Status Page instance with test incidents and components for populating the status table. A default test API URL and OAuth authorization token can be found in `local.env`.

## Atrribution
Original plugin design and functionality implemented by team XE Compass

https://gitlab.cee.redhat.com/app-dev-platform/backstage-plugins/-/tree/main/plugins/outage-template
