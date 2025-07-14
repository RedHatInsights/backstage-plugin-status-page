# @compass/backstage-plugin-soundcheck-backend-module-red-hat-service-now

The red-hat-service-now backend module for the soundcheck plugin.

_This plugin was created through the Backstage CLI_

Add to .env
```zsh
SERVICE_NOW_HOST="redhat.service-now.com"
SERVICE_NOW_BASE_API_URL="https://redhat.service-now.com/"
SERVICE_NOW_USERNAME='replace_me'
SERVICE_NOW_PASSWORD='replace_me'
```

Add to soundcheck-config.yaml
```yaml
integrations:
  - servicenow:
    host: ${SERVICE_NOW_HOST}
    apiBaseUrl: ${SERVICE_NOW_BASE_API_URL}
    credentials:
      username: ${SERVICE_NOW_USERNAME}
      password: ${SERVICE_NOW_PASSWORD}

soundcheck:
  collectors:
    servicenow: 
      initialDelay:
        minutes: 15
      collects:
        - type: compliance_controls
          filter:
            - kind: businessapplication
          cache: true
          frequency:
            hours: 4

```
