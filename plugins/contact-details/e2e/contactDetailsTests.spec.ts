import { test, expect } from '@playwright/test';
import { LandingPage } from './helpers/landingPage';
import { ContactDetailsCard } from './helpers/contactDetailsCard';

test.describe('BackStage Contact Details Tests Plugin', async () => {

  test('Test the Contact Details Card plugin with no config in place', async ({
    page,
  }) => {
    const Landing = new LandingPage(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.openTheExampleWebsiteTab();
    await expect(page.getByText('Contact Details')).not.toBeAttached();
  });
  test('Test Contact Details Card plugin for the configured property', async ({ page }) => {
    const Landing = new LandingPage(page);
    const contactDetailsCard = new ContactDetailsCard(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.getContactDetailsService();
    await expect(
      page.getByText('example-service-for-contact-details-plugin'),
    ).toBeVisible();
      await expect(page.getByText('Contact Details')).toBeAttached();
    await contactDetailsCard.checkConfigOptions();
    await contactDetailsCard.verifyCardData();
  });
});
