import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: 'e2e/**/*.cy.{ts,tsx}',
    supportFolder: './support/',
    supportFile: './support/e2e.ts',
    fixturesFolder: './fictures/',
    videosFolder: './videos/',
    downloadsFolder: './downloads/',
    screenshotsFolder: './screenshots/',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportHeight: 900,
    viewportWidth: 1440,
  },
});
