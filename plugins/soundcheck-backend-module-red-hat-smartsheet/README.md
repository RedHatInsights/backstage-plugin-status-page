# @appdev-platform/backstage-plugin-soundcheck-backend-module-smartsheet

The smartsheet backend module for the soundcheck plugin.

_This plugin was created through the Backstage CLI_
https://backstage.spotify.com/docs/plugins/soundcheck/tutorials/custom-fact-collector

Add to .env
```bash
SMARTSHEET_API_TOKEN=<token>
SMARTSHEET_SHEET_ID='5931846954444676'
```

Add to app-config.yaml
```yaml
soundcheck:
  collectors:
    redHatSmartSheet:
      - api_token: ${SMARTSHEET_API_TOKEN}
        sheetId: ${SMARTSHEET_SHEET_ID}
```
