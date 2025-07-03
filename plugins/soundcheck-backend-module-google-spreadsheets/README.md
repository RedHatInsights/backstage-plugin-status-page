# Soundcheck Module for Google Spreadsheets

This module will help to use google spreadsheet as a fact collector for backstage services.

## Installation

1. Installing plugin
    ```bash
    yarn workspace backend add @appdev-platform/backstage-plugin-soundcheck-backend-module-google-spreadsheets 
    ```

2. Adding module to backend
    ```ts title=backend/src/index.ts
    backend.add(import('@appdev-platform/backstage-plugin-soundcheck-backend-module-google-spreadsheets'));
    backend.start();
    ```

3. Configuring the module
    ```yaml
    soundcheck:
      collectors:
        googleSpreadsheets:
          frequency: 
            hours: 2
          initialDelay:
            minutes: 5
          
          # Path to google credentials
          googleCredentials: 'path/to/credentials.json'
          collects:
              # Fact name
            - type: qe_scorecard
              
              # Spreadsheet id of google spreadsheet to collect data from.
              spreadsheetId: <google spreadsheet id>

              # Range of cells to fetch from your spreadsheet
              range: A:Z100
              
              # Define your own fact schema
              # Optional
              factSchema: {}             
    ```

## Available Collects Type &amp; Facts:

- `qe_scorecard`:
  - Facts:
    - `qe-charter-adherence`
    - `qe-release-quality`
    - `qe-resource-alignment`
    - `qe-sonarqube-integration-rating`
    - `qe-application-monitoring`
    - `qe-automation-review`
    - `qe-nonfunctional-testing`
    - `qe-professional-development`
    - `qe-pipeline-ownership`

### TODO: Make it configurable from UI
