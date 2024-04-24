import { test, expect } from '@playwright/test';
import { LandingPage } from './helpers/landingPage';
import { CMDBCardPage } from './helpers/cmdbCard';

test.describe('BackStage CMDB Plugin', async () => {
  test('Test the CMDB Card plugin with no config in place', async ({
    page,
  }) => {
    const Landing = new LandingPage(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.openTheExampleWebsiteTab();
    await expect(page.getByText('CMDB Details')).not.toBeAttached();
  });
  test('Test CMDB card plugin for the configured property', async ({ page }) => {
    const Landing = new LandingPage(page);
    const cmdbCard = new CMDBCardPage(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.getCMDBService();
    await expect(
      page.getByText('example-service-for-cmdb-plugin'),
    ).toBeVisible();
    await cmdbCard.checkConfigOptions();
    await cmdbCard.verifyCardData();
  });
})
